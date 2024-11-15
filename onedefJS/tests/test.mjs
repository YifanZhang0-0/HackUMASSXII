const tests = []
export function new_test(name, func) {
  tests.push([name, func])
}

export async function run_tests(funcs) {
  let passed = 0
  for (const [name, func] of tests) {
    try {
      await func()
      console.log(`passed ${name}`)
      passed++
    }
    catch (e) {
      console.log(`failed ${name}: ${e}`)
    }
  }
  if (passed == tests.length) {
    console.log("all tests passed!")
    process.exit(0)
  }
  else {
    console.log(`${passed}/${tests.length} tests passed`) 
    process.exit(1)
  }
}

