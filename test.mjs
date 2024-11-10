import { loadPY } from "./onedefJS/client/load.mjs"
const obj = await loadPY("test.py")
console.info = () => {}; // silence errors

console.log(await obj.addfive(3))

obj.close()




