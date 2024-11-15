import { encode_param, decode } from '../coding.mjs';
import { strict as assert } from 'assert';
import { Magic } from '../magic.mjs';
import { new_test, run_tests } from "./test.mjs"

function test_any(name, ori, type, comparator=(a, b) => a == b) { return new_test(name, () => {
    let enc = []
    encode_param(ori, type, enc)
    let dec = decode(new Uint8Array(enc), 0)
    assert(comparator(ori, dec), `encoded ${ori} got ${dec} back`)
})}

function test_encode(name, ori, type, arr) { return new_test(name, () => {
    let enc = []
    encode_param(ori, type, enc)
    assert(JSON.stringify(enc) == JSON.stringify([...arr]), `mismatch between ${JSON.stringify(enc)} and ${JSON.stringify([...arr])}`)
})}
function test_decode(name, ori, arr) { return new_test(name, () => {
    let res = decode(arr, 0)
    assert(res == ori, `expected ${ori} got ${res}`)
})}

const test_array=(name, arr) => test_any(name, arr, Magic.ARRAY, (a, b) => JSON.stringify(a) == JSON.stringify(b))
const test_object=(name, obj) => test_any(name, obj, Magic.OBJECT, (a, b) => JSON.stringify(a) == JSON.stringify(b))

test_any("test int", 69, Magic.INT)
test_any("test float", -69.420, Magic.FLOAT),
test_any("test string", "Hello World", Magic.STRING),
test_array("test array", [4, 5, 'world']),
test_object("test object", {a: 5, b: "dog"})

test_any("test large int", 0x0002030405060708, Magic.INT),
test_any("test negative int", -5, Magic.INT)
test_array("test 2D array", [1, [2], [[3]]])
test_object("test nested object", {a: {b: 4.65}})

test_encode("test encode int", 5, Magic.INT, new Uint8Array([0xA1, 0, 0, 0, 0, 0, 0, 0, 5]))
test_decode("test decode int", 5, new Uint8Array([0xA1, 0, 0, 0, 0, 0, 0, 0, 5]))

run_tests()
