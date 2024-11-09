import { encoding } from './coding.mjs';
import { setup_socket } from "./client/spinup.mjs"

export const PY="python"
export const JS="javascript"

// function definition
export class Function {
  constructor(types, ret, id, name, exec) {
    this.types = types
    this.ret = ret
    this.id = id
    this.name = name
    this.exec = exec || undefined // we only care about this on the client side
  }
}

// return from a function
export class Return {
  constructor(value, ret) {
    this.value = value
    this.ret = ret
  }
}

export class Library {
  constructor(filename, filetype) {
    this.filename = filename
    this.filetype = filetype
    this.functions = undefined // list of functions populated by load
    this.socket = undefined // write to this in socket setup
    this.server = undefined
    this.ret = 0 // global ret increment thingy
    this.waitlist = []
  }

  write(bytes) {
    this.socket.send(bytes)
  }

  async load() {
    
    await setup_socket(this, `/tmp/${this.filename}.sock`)
    
    for (const func of this.functions) {
      this[func.name] = async (...params) => {
        await this.run(func.id, ...params)
      }
    }
  }

  async run(id, ...params) {
    let retid = this.ret++

    let bytes = encoding(this.functions[id], retid, ...params)
    
    const wait = new Promise((res, _rej) => {
      this.waitlist.push([retid, res])
    })
    // send the byte array off
    console.log("sending", bytes)
    this.socket.write(bytes)
    console.log("sent")
    // wait to get sent notified for the correct thing
    let retvalue = await wait
    console.log("got wait back")
    return retvalue
  }

  close() {
    this.socket.destroy()
    this.server.close()
  }
}





