
import { loadPY } from "./unicallJS/client/load.mjs"
const obj = await loadPY("test.py")
// console.log(obj.addfive)
const res = await obj.addfive(5)

console.log(res)
obj.close()

