import { encoding } from './coding.mjs';
import { run_server, setup_socket } from "./client/spinup.mjs"

const PY="python"
const JS="javascript"

// function definition
class Function {
  constructor(types, ret, id, name) {
    this.types = types
    this.ret = ret
    this.id = id
    this.name = name
  }
}

// return from a function
class Return {
  constructor(value, ret) {
    this.value = value
    this.ret = ret
  }
}

class Library {
  constructor(filename, filetype) {
    this.filename = filename
    this.filetype = filetype
    this.functions = undefined // list of functions populated by load
    this.socket = undefined // write to this in socket setup
    this.ret = 0 // global ret increment thingy
    this.waitlist = []
  }

  write(bytes) {
    this.socket.send(bytes)
  }

  async load() {
    
    await setup_socket(this, `/tmp/${filename}.sock`)
    for (func of functions) {
      this[func.name] = (...params) => {
        this.run(func.id, ...params)
      }
    }
  }

  async run(id, ...params) {
    let retid = this.ret++

    bytes = encoding(this.functions[id], retid, ...params)
    
    const wait = new Promise((res, _rej) => {
      this.waitlist.push([retid, res])
    })
    // send the byte array off
    this.send(bytes)
    // wait to get sent notified for the correct thing
    let retvalue = await wait
    return retvalue
  }
}





