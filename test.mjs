
import { loadPY } from "./unicallJS/client/load.mjs"
const obj = await loadPY("test.py")

console.log(obj)
console.log(obj.addfive)


