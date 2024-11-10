import { loadPY } from "./onedefJS/client/load.mjs"
const obj = await loadPY("llm.py")
// console.info = () => {}; // silence errors

console.log(await obj.ask_model("hi what's 9+10"))

obj.close()




