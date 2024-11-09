

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
    
  }
}





