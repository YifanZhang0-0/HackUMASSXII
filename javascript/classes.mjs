import {encoding} from './coding.mjs';

const PY="python"
const JS="javascript"

class Function {
  constructor(types, ret, id, name) {
    this.types = types
    this.ret = ret
    this.id = id
    this.name = name
  }
}



class Library {
  constructor(filename, filetype) {
    this.filename = filename
    this.filetype = filetype
    this.functions = [] // list of functions populated by load
  }

  load() {
    
  }
  run(id, ...params) {
    byteArray = encoding(this.function[id], ...params)
    // send the byte array off
    // push the func id to waitlist
  }
}





