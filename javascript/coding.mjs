packetHeader = 0xF1

function updateByteArray(byteArray, data, length) {
    newByteArray = new Uint8Array([...byteArray])
    return newByteArray
}

export function encoding(func, ...params) {
    byteArray = new Uint8Array();
    // func is func obj
    paramType = func.types // strings of the type itself
    ret = func.ret
    id = func.id
    funcName = func.name 

    // type checking
    for (let i = 0; i < params.length; i++) {
        try {
            typeof params[i] === paramType[i]
        } catch (_) {
            throw new Error("Type Mismatch in Parameters")
        }
    }

    // encoding function parts into byteArray
    

    // encoding parameters into byteArray

    return btyeArray
}