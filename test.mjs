
import { loadPY } from "./unicallJS/client/load.mjs"
const obj = await loadPY("test.py")
console.log("after")
const res = await obj.addfive(5)

console.log(res)
obj.close()

