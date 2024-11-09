import { encode } from 'punycode';
import { Magic } from './magic.mjs';
import assert from 'assert';

/**
 * Update the Unit8Array that carries binary info.
 * @param {Uint8Array} byte_array - The array containing all bytes we need to send.
 * @param {array} data - The data to be placed into byte_array.
 * @returns {Uint8Array} Updated byte_array.
 */
function updateByteArrray(byte_array, data) {
    let new_byte_array = new Uint8Array(byte_array.length + data.length);
    new_byte_array.set(byte_array)
    new_byte_array.set(data, byte_array.length)
    return new_byte_array
}

function initFunCall(byte_array, id, ret) {
    let place_holder = 0 // don't know byte_array length until end
    // split func id & ret id into two bytes
    let temp = new Uint16Array([id, ret])
    let id0 = temp[0] & 0xFF00 // first 8 bits
    let id1 = temp[0] & 0x00FF // last 8 bits
    let ret0 = temp[1] & 0xFF00 // first 8 bits
    let ret1 = temp[1] & 0x00FF // last 8 bits

    let data = [Magic.FCALL, place_holder, id0, id1, ret0, ret1]
    return updateByteArrray(byte_array, data)
}

export function encoding(func, ...params) {
    
    let byte_array = new Uint8Array();
    // func is func obj
    let param_types = func.types // strings of the type itself
    let ret = func.ret
    let id = func.id
    let func_name = func.name 

    // count checking
    if(!(params.length === param_types.length)) {
        throw new Error("Parameter Count Mismatch.")
    }

    // encoding function headers & metadata & ids into byte_array
    byte_array = initFunCall(byte_array, id, ret)

    // encoding parameters into byteArra
    for (let i = 0; i < param_types.length; i++) {
        let obj_run_param = params[i]
        let func_param_type = param_types[i]
        byte_array = encodeEachParam(byte_array, obj_run_param, func_param_type)
    }

    return byte_array
}

/**
 * Fact checking & tries type conversion & updates byte_array within each case
 * @param {array} params - params from obj.run, what we want to pass into python.
 * @param {array} param_types - actual function parameter types specified by python.
 */
function encodeEachParam(byte_array, obj_run_param, func_param_type, checkType=True) {
    // we check type by default, toggle off for Object encoding
    let data;
    switch (func_param_type) {
        case Magic.INT:
            if (checkType && !(typeof obj_run_param === 'number')) {
                throw new Error("Parameter Int Type Mismatch.")
            }
            data = intConvHelper(Math.floor(obj_run_param))
            byte_array = updateByteArrray(byte_array, Magic.INT, data)
            return byte_array;
        case Magic.FLOAT:
            if (checkType && !(typeof obj_run_param === 'number')) {
                throw new Error("Parameter Float Type Mismatch.")
            }
            data = floatConvHelper(Math.floor(obj_run_param))
            byte_array = updateByteArrray(byte_array, Magic.FLOAT, data)
            return byte_array;
        case Magic.STRING:
            if(checkType && !(typeof obj_run_param === 'string')) {
                throw new Error("Parameter String Type Mismatch.")
            }
            data = strConvHelper(obj_run_param)
            byte_array = updateByteArrray(byte_array, Magic.STRING, data)
            return byte_array;
        case Magic.ARRAY:
            // encoding array header
            let arr_len = obj_run_param.length
            let temp_arr = new Uint8Array(5)
            temp_arr[0] = Magic.ARRAY
            const temp_len_num = new Uint32Array([arr_len])
            for (let i = 0; i < 32; i +=4 ) { // encoding array length
                temp_arr[i/4 + 1] = Number(temp_len_num[0] >> (8 * 1) & 0xFF)
            }

            // encoding array content
            byte_array = recurArrHelper(byte_array, obj_run_param, Magic.ARRAY)
            return byte_array;
        case Magic.OBJECT:
            // encoding object header
            let obj_len = obj_run_param.length
            let temp_obj_arr = new Uint8Array(5)
            temp_obj_arr[0] = Magic.OBJECT
            const temp_obj_len = new Uint32Array([obj_len])
            for (let i = 0; i < 32; i += 4) {
                temp_obj_arr[i/4 + 1] = Number(temp_obj_len[0] >> (8 * 1) & 0xFF)
            }
            // encode each of the attributes within object
            // get obj key & values
            let key_and_val = []
            key_and_val = Object.entries(obj_run_param)
            byte_array = objConvHelper(byte_array, key_and_val[0], key_and_val[1])
            return byte_array;
        case Magic.VOID:
            byte_array = updateByteArrray(byte_array, [Magic.VOID])
            return byte_array
        default:
            throw new Error("Idk why tf ur here, this should not happen")
    }
}

/**
 * helper function for int conversion into bytes array 
 * @param {number} num - int from params
 * @returns {array} a byte array encoded with integer
 */
export function intConvHelper(num) {
    // convert int into 64 bits (8 bytes)
    const temp = new BigInt64Array([BigInt(num)])
    let int_arr = new Uint8Array(9) // header + int itself
    int_arr[0] = Magic.INT
    for (let i = 0; i < 64; i+=8) {
        // shift to right and mask to keep right most 8 bits
        int_arr[8 - i/8] = Number((temp[0] >> BigInt(8 * i)) & 0xFFn)
    }
    return int_arr
}

/**
 * helper function for float conversion into bytes array 
 * @param {number} num - float from params
 * @returns {array} a byte array encoded with float
 */
export function floatConvHelper(num) {
    // convert float into 64 bits (8 bytes)
    const temp = new Float64Array([num])
    let float_arr = new Uint8Array(9) // header + float itself
    float_arr[0] = Magic.FLOAT
    for (let i = 0; i < 64; i+=8) {
        // shift to right and mask to keep right most 8 bits
        float_arr[i/8 + 1] = Number(temp[0] >> (8 * i) & 0xFF) 
    }
    return float_arr
}

/**
 * helper function for string conversion into bytes array 
 * @param {string} str - string from params
 * @returns {array} a byte array encoded with string
 */
export function strConvHelper(str) {
    const temp = new Uint32Array([str.length]) //string length -> 4 bytes
    let str_head_len = new Uint8Array(5) // header + str len
    str_head_len[0] = Magic.STRING
    for (let i = 0; i < 32; i +=4) {
        str_head_len[i/4 + 1] = Number(temp[0] >> (8 * 1) & 0xFF)
    }
    let start_index = str_len.length
    let str_arr = new Uint8Array(4 + str.length)
    for (char in str.split("")) {
        // PUMP into str_arr the 8-bits chars
        str_arr[start_index] = String.prototype.codePointAt(char)
        start_index += 1
    }
    return str_arr
}

    // this is so clumped up
export function recurArrHelper(byte_array, obj_run_param) {
    // recurisvely tries to construct an array from the params
    // special case: empty array
    if (obj_run_param.length === 0) {
        byte_array =  updateByteArrray(byte_array, [0, 0, 0, 0])
        return byte_array
    }
    // none empty array / element
    for (n in obj_run_param) { 
        // singular element
        if (n.length === undefined) { 
            // recognize array element data type
            // no type checking
            if (isInt(n)) {
                byte_array = encodeEachParam(byte_array, n, Magic.INT, false)
                return byte_array
            } else if (isFloat(n)) {
                byte_array = encodeEachParam(byte_array, n, Magic.FLOAT, false)
                return byte_array
            } else if (typeof n === 'string') {
                byte_array = encodeEachParam(byte_array, n, Magic.STRING, false)
                return byte_array
            } else if (typeof x === 'object' && !Array.isArray(x) && x !== null) {
                // object 
                let key_and_val = []
                key_and_val = Object.entries(n)
                byte_array = objConvHelper(byte_array, key_and_val[0], key_and_val[1])
                return byte_array
            } else {
                // VOID type
                byte_array = encodeEachParam(byte_array, n, Magic.VOID)
                return byte_array
            }
        } else {
            return recurArrHelper(byte_array, n)
        }
    }
}

export function objConvHelper(byte_array, keys, values) {
    byte_array = updateByteArrray(byte_array, keys)
    // encoding values
    for (val in values) {
        byte_array = recurArrHelper(byte_array, val)
    }
    return byte_array
}

function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}





export function decode(arr, s) {
    return _decode(arr, s)[0]
}

function _decode(arr, s) {
    // get header
    const header = arr[s++] << 8 + arr[s++]
    switch(header) {
        case Magic.INT:
            let int = 0
            for (let i=0; i<8; i++) {
                int += data[s+i] << 8*(8-i)
            }
            return [int, 9]
        case Magic.FLOAT:
            let float = new Uint8Array(8)
            for (let i=0; i<8; i++) {
                float[i] = data[s+i]
            }
            return [Float64Array.from(float)[0], 9]
        case Magic.STRING:
            let slen = data[s++] << 24 + data[s++] << 16 + data[s++] << 8 + data[s++]
            let string = ""
            for (let i=s; i<slen+s; i++) {
                string += String.fromCharCode(data[i])
            }
            return [string, 5+slen]
        case Magic.ARRAY:
            let alen = data[s++] << 24 + data[s++] << 16 + data[s++] << 8 + data[s++]
            let array = []
            for (let i=0; i<alen; i++) {
                let [val, size] = _decode(data, s)
                s += size
                array.push(val)
            }
            return array
        case Magic.OBJECT:
            let olen = data[s++] << 24 + data[s++] << 16 + data[s++] << 8 + data[s++]
            let strings = []
            let object = {}
            for (let i=0; i<olen; i++) {
                let [str, len] = _decode(data, s)
                strings.push(str)
                s += len
            }
            for (let i=0; i<olen; i++) {
                let [val, len] = _decode(data, s)
                object[strings[i]] = val
                s += len
            }
            return object
        case Magic.VOID:
            return undefined
        case Magic.ERR:
            throw new Error("runtime error")
        default:
            throw new Error(`invalid header for return packet ${header}`)
    }
}


function encode_fdef(funclist) {
    let res = [0xF2, 0, 0, 0, 0]
    
    for (func in funclist) {
        encode_function(res, func)
    }
    let len = res.length - 5
    res[1] = len & 0xFF000000 >> 24
    res[2] = len & 0xFF0000 >> 16
    res[3] = len & 0xFF00 >> 8
    res[4] = len & 0xFF

    return Uint8Array(res)
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

export function decode_function(data, length) {
    let s=0
    let id = data[s++] << 8 + data[s++]
    let retid = data[s++] << 8 + data[s++]
    let params = []

    while (s < length) {
        let [val, len] = _decode(data, s)
        s += len
        params.push(val)
    }

    return [id, retid, params]
}



export function encode_return(retid, value, type) {
    let res = [0xB0, 0, 0, 0, 0]
    res.push((retid & 0xFF00) >> 8)
    res.push(retid & 0xFF)

    arr = encodeEachParam(value, type)
    arr.forEach(a => res.push(a));

    let len = res.length - 5
    res[1] = len & 0xFF000000 >> 24
    res[2] = len & 0xFF0000 >> 16
    res[3] = len & 0xFF00 >> 8
    res[4] = len & 0xFF

    return Uint8Array(res)
}

// Tests
{
    function demo_function(param) {}

    function test_updateByteArray() {
        let byteArray = new Uint8Array();
        const updated = updateByteArrray(byteArray, [1, 2, 3, 4]);
        assert.deepEqual(updated, new Uint8Array([1, 2, 3, 4]))        
    }

    function test_encode() {
        assert.equal(new Uint8Array(), encoding(demo_function, ['param']));
    }

    test_updateByteArray();
    test_encode();
}
