import { loadPY } from "./onedefJS/client/load.mjs"
const obj = await loadPY("test.py")
console.info = () => {}; // silence errors

console.log(await obj.addfive(5))
console.log(await obj.addfive(10))
console.log(await obj.addtoarray(2.5, [0, 2, 3]))

obj.close()




