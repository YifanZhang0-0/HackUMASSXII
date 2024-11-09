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
    this.functions = undefined // list of functions populated by load
  }

  load() {
    if (this.filetype == JS) {
      // Load JS file content
      const fileContent = readFileSync(this.filename);

      // Find global functions to add to this.functions
      for (const prop in globalThis) {
        if (typeof globalThis[prop] === 'function') {
          const func = new Function([], 'any', this.functions.length, prop);
          this.functions.push(func);
        }
      }

      console.log('Functions loaded:', this.functions.map(f => f.name));

    } else if (this.filetype == PY) {
      
    }
  }
  run(id, ...params) {
    byteArray = encoding(this.function[id], ...params)
    // send the byte array off
    // push the func id to waitlist
  }
}





