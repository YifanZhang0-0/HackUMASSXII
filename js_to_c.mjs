import { loadC } from "./onedefJS/client/load.mjs"
const obj = await loadC("c_test")
// console.info = () => {}; // silence errors

console.log(await obj.thingy)

obj.close()