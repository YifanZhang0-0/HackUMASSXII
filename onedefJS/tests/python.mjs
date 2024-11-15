import { load } from "../client/load.mjs"
import { new_test, run_tests } from "./test.mjs"
import { strict as assert } from "assert"
const py = await load.py("test.py")

function test_pass(name, value, func, expected=value, comparator=(a,b)=>a==b, error=a=>a) { return new_test(name, async () => {
  let computed = await func(value)
  assert(comparator(computed, expected), `expected ${error(expected)}, got ${error(computed)}`)
})}

function test_pass_deep(name, value, func, expected=value) {
  test_pass(name, value, func, expected, (a,b)=>JSON.stringify(a)==JSON.stringify(b), JSON.stringify)
}

test_pass("test int", -8, py.pass_int)
test_pass("test float", 6.4, py.pass_float)
test_pass("test string", "heyo", py.pass_string)
test_pass_deep("test array", [1, 2, 3], py.pass_array)
test_pass_deep("test object", {a: 5, b: "dog"}, py.pass_object)

await run_tests()

py.close()




