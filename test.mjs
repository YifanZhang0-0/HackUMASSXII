
import { loadPY } from "./unicallJS/client/load.mjs"
const obj = await loadPY("test.py")
// console.log(obj.addfive)
console.log(await obj.addfive(5))
console.log(await obj.addfive(10))

obj.close()




