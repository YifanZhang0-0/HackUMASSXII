import * as coding from '../coding.mjs';
import assert from 'assert';
import { Magic } from '../magic.mjs';


function test_int_encoding() {
    let test_int_array = coding.intConvHelper(69)
    // console.log(test_int_array)
    assert(test_int_array instanceof Uint8Array)
    assert(test_int_array.length === 9)
    let reconstructed_int = coding.decode(test_int_array, 0)
    // console.log(reconstructed_int)
    assert(reconstructed_int === 69, 'Encoding Decoding Int Failure')
}

function test_float_encoding() {
    let test_float_array = coding.floatConvHelper(69.420)
    console.log(test_float_array)
    // console.log(test_float_array)
    assert(test_float_array instanceof Uint8Array)
    assert(test_float_array.length === 9)
    let reconstructed_float = coding.decode(test_float_array, 0)
    assert(reconstructed_float === 69.420, "Encoding Decoding Float Failure")
    
}

function test_str_encoding() {
    let str = "Hello World"
    let test_str_array = coding.strConvHelper(str)
    // console.log(test_str_array)
    assert(test_str_array instanceof Uint8Array)
    assert(test_str_array.length === (5 + str.length))
}

function test_arr_encoding() {
    let arr = [4, 5, 'world']
    let dummy = [69]
    let byte_array = new Uint8Array(dummy) // why not ?
    let test_arr_array = coding.recurArrHelper(byte_array, arr)
    // console.log(test_arr_array)
    assert(test_arr_array.length === 34)
}

function test_object_encoding() {
    const dog = new Object()
    dog.name = 'cat'
    dog.age = 69
    dog.owner = 'horse'
    dog.friend = 'fish'
    let keys = []
    let values = []

    for (const pair of Object.entries(dog)) {
        keys.push(pair[0])
        values.push(pair[1])
    }

    let test_obj_array = new Uint8Array()
    test_obj_array = coding.encodeEachParam(test_obj_array, dog, Magic.OBJECT, false)
    // console.log(test_obj_array)
    assert(test_obj_array[0] === 165)
    // console.log(test_obj_array.length)
    assert(test_obj_array.length === 79)
}

test_int_encoding()
test_float_encoding()
test_str_encoding()
test_arr_encoding()
test_object_encoding()

