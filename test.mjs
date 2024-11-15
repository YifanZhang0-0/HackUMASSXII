import { load } from "./onedefJS/client/load.mjs"
const obj = await load.py("test.py")

console.log(await obj.addfive(5))
// console.log(await obj.ask_model("why is the sun so bright???"))

obj.close()




