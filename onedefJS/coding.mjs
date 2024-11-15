import { Magic } from './magic.mjs';
import { strict as assert } from "assert";
import { Function } from "./classes.mjs"

/**
 * encodes a function call with specific parameters
 * @param {Function} func
 * @param {number} retid
 * @param {...*} params 
 */
export function encode_call(func, retid, ...params) {
    const res = [Magic.FCALL, 0, 0, 0, 0]
    res.push((func.id >> 8) & 0xFF)
    res.push(func.id & 0xFF)
    res.push((retid >> 8) & 0xFF)
    res.push(retid & 0xFF)
    assert(func.types.length == params.length, `Mismatched number of args: wanted ${func.types.length} but got ${params.length}`)
    for (let i=0; i<params.length; i++) {
        encode_param(params[i], func.types[i], res)
    }
    let len = res.length-5
    res[1] = (len & 0xFF000000) >> 24
    res[2] = (len & 0xFF0000) >> 16
    res[3] = (len & 0xFF00) >> 8
    res[4] = (len & 0xFF)
    return new Uint8Array(res)
}

/**
 * encodes an entire function manifest (all available functions to call)
 * @param {Array<Function>} funcs 
 */
export function encode_manifest(funcs) {
    let res = [0xF2, 0, 0, 0, 0]
    for (const func of funcs) {
        encode_def(func, res)
    }
    let len = res.length-5
    res[1] = (len & 0xFF000000) >> 24
    res[2] = (len & 0xFF0000) >> 16
    res[3] = (len & 0xFF00) >> 8
    res[4] = (len & 0xFF)
    return new Uinit8Array(res)
}
/**
 * encodes a single function's definition
 * @param {Function} func 
 * @param {Array<number>} res
 */
function encode_def(func, res) {
    // encode 2 byte id
    res.push((func.id & 0xFF00) >> 8)
    res.push(func.id & 0xFF)
    // encode 2 byte length of function name
    res.push((func.name.length & 0xFF00) >> 8)
    res.push(func.name.length & 0xFF)
    // encode function name
    for (let i=0; i<func.name.length; i++) {
        res.push(func.name.charCodeAt(i))
    }
    // encode return type
    res.push(func.ret)
    // encode number of arguments
    res.push((func.types.length & 0xFF00) >> 8)
    res.push(func.types.length & 0xFF)
    // encode argument types
    func.types.forEach(a => {
        res.push(a)
    })
}

/**
 * encodes a single value with a return id to be returned
 * @param {number} retid 
 * @param {*} value 
 * @param {number} type 
 */
export function encode_return(retid, value, type) {
    let res = [0xB0, 0, 0, 0, 0]
    res.push((retid & 0xFF00) >> 8)
    res.push(retid & 0xFF)

    encode_param(value, type, res)

    let len = res.length - 5
    res[1] = (len & 0xFF000000) >> 24
    res[2] = (len & 0xFF0000) >> 16
    res[3] = (len & 0xFF00) >> 8
    res[4] = (len & 0xFF)

    return new Uint8Array(res)
}
/**
 * encodes params, does type checking
 * @param {*} param 
 * @param {number} type 
 * @param {Array} res
 */
export function encode_param(param, type, res) {
    switch (type) {
        case Magic.INT:
            assert(typeof param == "number", `TypeError: ${param} is not a number!`)
            res.push(Magic.INT)
            let dv = new DataView(new ArrayBuffer(8))
            dv.setBigInt64(0, BigInt(param), true)
            for (let i=7; i>=0; i--) {
                res.push(dv.getUint8(i))
            }
            break;
        case Magic.FLOAT:
            assert(typeof param == "number", `TypeError: ${param} is not a number!`)
            res.push(Magic.FLOAT)
            res.push(...new Uint8Array(new Float64Array([param]).buffer))
            break;
        case Magic.STRING:
            assert(typeof param == "string", `TypeError: ${param} is not a string!`)
            encode_param_loose(param, res)
            break;
        case Magic.ARRAY:
            assert(typeof param == "object" && Array.isArray(param), `TypeError: ${param} is not an array!`)
            encode_param_loose(param, res)
            break;
        case Magic.OBJECT:
            assert(typeof param == "object" , `TypeError: ${param} is not an object!`)
            encode_param_loose(param, res)
            break;
        default:
            throw Error(`invalid type: ${type}`)
    }
}

/**
 * encodes params, infers type from value of param
 * @param {*} param 
 * @param {Array} res
 */
export function encode_param_loose(param, res) {
    const type = typeof param
    switch (type) {
        case "bigint":
        case "boolean":
        case "number":
            let num=param
            if (type == "bigint") num = BigInt.asIntN(64, param)
            if (type == "boolean") num = param ? 0 : 1
            // get type and do different things based off type
            if (num % 1 == 0) {
                res.push(Magic.INT)
                let dv = new DataView(new ArrayBuffer(8))
                dv.setBigInt64(0, BigInt(param), true)
                for (let i=7; i>=0; i--) {
                    res.push(dv.getUint8(i))
                }
            }
            else {
                res.push(Magic.FLOAT)
                res.push(...new Uint8Array(new Float64Array([num]).buffer))
            }
            break;
        case "string":
            res.push(Magic.STRING)
            for (let i=0; i<4; i++) {
                res.push((param.length >> 8*(3-i)) & 0xFF)
            }
            for (let i=0; i<param.length; i++) {
                res.push(param.charCodeAt(i))
            }
            break;
        case "object":
            if (Array.isArray(param)) {
                res.push(Magic.ARRAY)
                res.push((param.length & 0xFF000000) >> 24)
                res.push((param.length & 0xFF0000) >> 16)
                res.push((param.length & 0xFF00) >> 8)
                res.push((param.length & 0xFF))
                for (let i=0; i<param.length; i++) {
                    encode_param_loose(param[i], res)
                }
            } else {
                let keys = []
                let values = [] 
                for (const pair of Object.entries(param)) {
                    keys.push(pair[0])
                    values.push(pair[1])
                }
                res.push(Magic.OBJECT)
                res.push((keys.length & 0xFF000000) >> 24)
                res.push((keys.length & 0xFF0000) >> 16)
                res.push((keys.length & 0xFF00) >> 8)
                res.push((keys.length & 0xFF))
                for (const key of keys) {
                    encode_param(key, Magic.STRING, res)
                }
                for (const value of values) {
                    encode_param_loose(value, res)
                }
            }
            break;
        case "undefined":
            res.push(Magic.VOID)
            break;
        default:
            throw Error(`type ${type} cannot be serialized`)
    }
}





/**
 * decodes a uint8array arr starting from point s
 * @param {Uint8Array} arr 
 * @param {number} s
 * @returns {*}
 */
export function decode(arr, s) {
    return _decode(arr, s)[0]
}

/**
 * decodes and returns both value and length. This is used
 * recursively and the length is necessary in order to add
 * to s
 * @param {Uint8Array} arr
 * @param {number} s
 * @returns {Array}
 */
function _decode(arr, s) {
    // get header
    const header = arr[s++]
    switch(header) {
        case Magic.INT:
            let int = new Uint8Array(8)
            for (let i=0; i<8; i++) {
                int[i] = arr[s+i]
            }
            return [Number(new DataView(int.buffer).getBigInt64(0, false)), 9]
        case Magic.FLOAT:
            let float = new Uint8Array(8)
            for (let i=0; i<8; i++) {
                float[i] = arr[s+i]
            }
            return [new DataView(float.buffer).getFloat64(0, true), 9]
        case Magic.STRING:
            let slen = (arr[s++] << 24) + (arr[s++] << 16) + (arr[s++] << 8) + arr[s++]
            let string = ""
            // const string = String.fromCharCode(arr.slice(s, s + slen))
            for (let i=s; i<slen+s; i++) {
                string += String.fromCharCode(arr[i])
            }
            return [string, 5+slen]
        case Magic.ARRAY:
            let as0 = s
            let alen = (arr[s++] << 24) + (arr[s++] << 16) + (arr[s++] << 8) + arr[s++]
            let array = []
            for (let i=0; i<alen; i++) {
                let [val, size] = _decode(arr, s)
                s += size
                array.push(val)
            }
            return [array, s-as0+1]
        case Magic.OBJECT:
            let os0 = s;
            let olen = (arr[s++] << 24) + (arr[s++] << 16) + (arr[s++] << 8) + arr[s++]
            let strings = []
            let object = {}
            for (let i=0; i<olen; i++) {
                let [str, len] = _decode(arr, s)
                strings.push(str)
                s += len
            }
            for (let i=0; i<olen; i++) {
                let [val, len] = _decode(arr, s)
                object[strings[i]] = val
                s += len
            }
            return [object, s-os0+1]
        case Magic.VOID:
            return undefined
        case Magic.ERR:
            throw new Error("runtime error")
        default:
            throw new Error(`invalid header for return packet ${header} at position ${s} in ${arr}`)
    }
}


export function encode_fdef(funclist) {
    let res = [0xF2, 0, 0, 0, 0]
    
    for (const func of funclist) {
        encode_function(res, func)
    }
    let len = res.length - 5
    res[1] = (len & 0xFF000000) >> 24
    res[2] = (len & 0xFF0000) >> 16
    res[3] = (len & 0xFF00) >> 8
    res[4] = (len & 0xFF)
    return new Uint8Array(res)
}

function encode_function(res, func) {
    // encode 2 byte id
    res.push((func.id & 0xFF00) >> 8)
    res.push(func.id & 0xFF)
    // encode 2 byte length of function name
    res.push((func.name.length & 0xFF00) >> 8)
    res.push(func.name.length & 0xFF)
    // encode function name
    for (let i=0; i<func.name.length; i++) {
        res.push(func.name.charCodeAt(i))
    }
    // encode return type
    res.push(func.ret)
    // encode number of arguments
    res.push((func.types.length & 0xFF00) >> 8)
    res.push(func.types.length & 0xFF)
    // encode argument types
    func.types.forEach(a => {
        res.push(a)
    })
}

/*
export function decode_function(data, length) {
    let s=0
    let id = (data[s++] << 8) + data[s++]
    let retid = (data[s++] << 8) + data[s++]
    let params = []

    while (s < length) {
        let [val, len] = _decode(data, s)
        s += len
        params.push(val)
    }

    return [id, retid, params]
}*/

/**
 * @param {Uint8Array} data 
 * @param {number} length 
 * @returns {Array} returns [function, new start idx]
 */
export function decode_header(data, s) {
    const id = (data[s++] << 8) + data[s++]
    let slen = (data[s++] << 8) + data[s++] + s
    let name = ""
    for (; s<slen; s++) {
        name += String.fromCharCode(data[s])
    }

    const ret = data[s++]
    let arglen = (data[s++] << 8) + data[s++] + s
    const types = []
    for (; s < arglen; s++) {
        types.push(data[s])
    }
    return [new Function(types, ret, id, name), s]
}

