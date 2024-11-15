import { encode_call, decode_header, decode } from './coding.mjs';
import { setup_socket } from "./client/spinup.mjs"
import { strict as assert } from "assert"

export const Langs = {
  PY: "python",
  JS: "javascript",
  C: "c"
}


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
    
    // TODO: increment this if it already exists
    // TODO: on client, remove existing socket
    await setup_socket(this, `/tmp/${this.filename}.sock`)
    
    for (const func of this.functions) {
      this[func.name] = async (...params) => await this.run(func.id, ...params)
    }

    return this
  }

  async run(id, ...params) {
    let retid = this.ret++

    let bytes = encode_call(this.functions[id], retid, ...params)
    
    const wait = new Promise((res, _rej) => {
      this.waitlist.push([retid, res])
    })
    // send the byte array off
    this.socket.write(bytes)
    // wait to get sent notified for the correct thing
    return await wait
  }

  close() {
    this.socket.destroy()
    this.server.close()
  }

  set_functions(data) {
    assert(this.functions === undefined, "attempted to redefine functions")
    this.functions = []

    let s = 0;
    while (s < data.length) {
      let [func, s1] = decode_header(data, s)
      this.functions.push(func)
      s = s1
    }
  }

  process_return(data) {
    
    let s=0
    const retid = (data[s++] << 8) + data[s++]
    const value = decode(data, 2)

    let idx;
    this.waitlist.forEach((a, i) => {
      if (a[0] != retid) return
      idx = i
      a[1](value)
    })

    if (idx === undefined)
      throw new Error(`return id ${retid} not found in waitlist`);
    this.waitlist.splice(idx, 1)

  }
  
}





