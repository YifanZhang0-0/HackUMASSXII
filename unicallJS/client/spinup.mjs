import * as net from "net"
import * as fs from "fs"
import { exec } from "child_process"
import { Function, PY } from "../classes.mjs"
import { strict as assert } from "assert"
import { decode } from "../coding.mjs"

export async function setup_socket(library, socket_name) {
  const function_def_finished = new Promise((res, _) => {

    if (fs.existsSync(socket_name)) fs.rmSync(socket_name)
    library.server = net.createServer((socket) => {
      library.socket = socket
      socket.on("readable", () => {
        // first we have to get the functions
        if (library.functions === undefined) {

          const read = socket.read(5)
          if (read == null) return
          const head = new Uint8Array(read)

          assert(head[0] == 0xF2)
          const length = (head[1] << 24) + (head[2] << 16) + (head[3] << 8) + head[4]
          const data = new Uint8Array(socket.read(length))

          get_functions(library, data, length)
          return res()
        }

        // otherwise it's a return
        // TODO: assert head is 0xF1
        const read = socket.read(5)
        if (read == null) return
        const head = new Uint8Array(read)
        assert(head[0] == 0xF1)
        const length = head[1] << 24 + head[2] << 16 + head[3] << 8 + head[4]
        const data = new Uint8Array(socket.read(length))
        process_return(library, data, length)
      })
    })

    //first we listen
    library.server.listen(socket_name)
    //then we run the server
    run_server(library.filetype, library.filename, socket_name)
  })
  
  await function_def_finished
}

function run_server(type, file, socket_name) {
  switch (type) {
    case PY:
      exec(`python ${file} socket=${socket_name} > out`)
      break;
    default:
      throw new Error("bad language")
  }
}

function get_functions(library, data, length) {

  library.functions = []
  let sidx = 0;
  while (sidx < length) {
    sidx = get_function(library.functions, data, sidx)
  }
}


function get_function(list, data, s) {
  const id = (data[s++] << 8) + data[s++]
  let slen = (data[s++] << 8) + data[s++] + s
  let name = ""
  for (; s<slen; s++) {
    name += String.fromCharCode(data[s])
  }
  const ret = data[s++]
  let arglen = (data[s++] << 8) + data[s++] + s
  const types = []
  for (; s < arglen; s++) {
    types.push(data[s])
  }
  
  list.push(new Function(types, ret, id, name))
  return s
  
}

function process_return(library, data) {
  let s=0
  const retid = (data[s] << 8) + data[++s]
  const value = decode(data, ++s)

  let idx = -1
  library.waitlist.forEach((a, i) => {
    if (a[0] != retid) return
    idx = i
    a[1](value)
  })

  if (idx == -1) throw new Error(`return id ${retid} not found in waitlist`)
  library.waitlist.splice(idx, 1)
}










