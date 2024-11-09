import { param } from 'express/lib/request';
import {Magic} from './magic.mjs';

/**
 * Update the Unit8Array that carries binary info.
 * @param {Uint8Array} byteArray - The array containing all bytes we need to send.
 * @param {array} data - The data to be placed into byteArray.
 * @returns {Uint8Array} Updated byteArray.
 */
function updateByteArray(byteArray, data) {

    let startIndex = byteArray.length
    let newByteArray = new Uint8Array(byteArray.length + data.length)
    newByteArray.copy(byteArray)

    for (d in data) {
        newByteArray.set([d], startIndex)
        startIndex += 1
    }

    return newByteArray
}

function initFunCall(byteArray, id, ret) {
    placeHolder = 0 // don't know byteArray length until end
    // split func id & ret id into two bytes
    let temp = new Uint16Array([id, ret])
    id0 = temp[0] & 0xFF00 // first 8 bits
    id1 = temp[0] & 0x00FF // last 8 bits
    ret0 = temp[1] & 0xFF00 // first 8 bits
    ret1 = temp[1] & 0x00FF // last 8 bits

    data = [Magic.FCALL, placeHolder, id0, id1, ret0, ret1]
    return updateByteArray(byteArray, data)
}

export function encoding(func, ...params) {
    
    let byteArray = new Uint8Array();
    // func is func obj
    paramType = func.types // strings of the type itself
    ret = func.ret
    id = func.id
    funcName = func.name 

    // count checking
    try {
        params.length === paramType.length
    } catch (_) {
        throw new Error("Parameter Count Mismatch.")
    }

    // encoding function headers & metadata & ids into byteArray
    byteArray = initFunCall(byteArray, id, ret)

    // encoding parameters into byteArra
    encodingParam(params, paramType)

    return byteArray
}

/**
 * Fact checking & tries type conversion & updates byteArray within each case
 * @param {array} params - params from obj.run, what we want to pass into python.
 * @param {array} paramType - actual function parameter types specified by python.
 */
function encodingParam(params, paramType) {
    for (let i = 0; i < paramType.length; i++) {
        switch (paramType[i]) {
            case Magic.INT:
                if (!(typeof params[i] === 'number')) {
                    throw new Error("Parameter Int Type Mismatch.")
                }
                data = intConvHelper(Math.floor(params[i]))
                byteArray = updateByteArray(byteArray, Magic.INT, data)
                break;
            case Magic.FLOAT:
                if (!(typeof params[i] === 'number')) {
                    throw new Error("Parameter Float Type Mismatch.")
                }
                data = floatConvHelper(Math.floor(params[i]))
                byteArray = updateByteArray(byteArray, Magic.FLOAT, data)
                break;
            case Magic.STRING:
                if(!(typeof params[i] === 'string')) {
                    throw new Error("Parameter String Type Mismatch.")
                }
                data = strConvHelper(params[i])
                byteArray = updateByteArray(byteArray, Magic.STRING, data)
                break;
            case Magic.ARRAY:
                recurArrHelper()
                // selects part of params
                break;
            case Magic.OBJECT:
                break;
            default:
                throw new Error("Idk why tf ur here, this should not happen")
        }
    }
}

function intConvHelper(num) {
    // convert int into 64 bits (8 bytes)
    const temp = new BigInt64Array([num])
    intArr = new Uint8Array(8)
    for (let i = 0; i < 64; i+=8) {
        // shift to left and mask to keep left most 8 bits
        intArr[i/8] = Number(temp[0] >> (8 * i) & 0xFF) 
    }
    return intArr
}

function floatConvHelper(num) {
    // convert int into 64 bits (8 bytes)
    const temp = new Float64Array([num])
    floatArr = new Uint8Array(8)
    for (let i = 0; i < 64; i+=8) {
        // shift to left and mask to keep left most 8 bits
        floatArr[i/8] = Number(temp[0] >> (8 * i) & 0xFF) 
    }
    return floatArr
}

function strConvHelper(str) {
    const temp = new Uint32Array([str.length])
    strLen = new Uint8Array(4) // srting length -> 4 bytes
    for (let i = 0; i < 32; i +=4) {
        strLen[i/4] = Number(temp[0] >> (4 * 1) & 0xFF)
    }
    let startIndex = strLen.length
    strArr = new Uint8Array(4 + str.length)
    for (char in str.split("")) {
        // PUMP into strArr the 8-bits chars
        strArr[startIndex] = String.prototype.codePointAt(char)
        startIndex += 1
    }
    return strArr
}

function recurArrHelper() {
    // TODO 
    // recurisvely tries to construct an array from the params
}







function decode(arr, s) {
    // get header
    const header = arr[s] << 8 + arr[++s]
    switch(header) {
        case Magic.INT:
            let res = 0
            for (let i=0; i<8; i++) {
                res += data[s+i] << 8*(8-i)
            }
            return res
        case Magic.FLOAT:
            break
        case Magic.STRING:
            break
        case Magic.ARRAY:
            break
        case Magic.OBJECT:
            break
        case Magic.VOID:
            return undefined
        case Magic.ERR:
            throw new Error("runtime error")
        default:
            throw new Error(`invalid header for return packet ${header}`)
    }
}

