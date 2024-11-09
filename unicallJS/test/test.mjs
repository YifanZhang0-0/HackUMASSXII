import {intConvHelper, decode} from '../coding.mjs';
import assert from 'assert';


let test_int_array = intConvHelper(69)
console.log(test_int_array)
assert(test_int_array instanceof Uint8Array)
assert(test_int_array.length === 9)
reconstructed_int = decode(test_int_array, 0)
console.log(reconstructed_int)
assert(reconstructed_int === 69, 'Encoding Decoding Int Failure')