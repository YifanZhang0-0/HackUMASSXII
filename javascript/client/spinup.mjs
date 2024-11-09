import * as net from "net"
import * as fs from "fs"
import { exec } from "child_process"
import { PY, JS } from "../coding.mjs"
import { Function } from "../classes.mjs"

import { Magic } from "../magic.mjs"

async function setup_socket(library, socket_name) {
  const function_def_finished = new Promise((res, _) => {

    if (fs.existsSync(socket_name)) fs.rmSync(socket_name)
    const server = net.createServer((socket) => {
      socket.on("readable", () => {
        // first we have to get the functions
        if (library.functions === undefined) {
          const head = new UInt8Array(socket.read(3))
          // TODO: ASSERT HEAD IS 0xF2
          const length = head[1] << 24 + head[2] << 16 + head[1] << 8 + head[2]
          const data = new UInt8Array(socket.read(length))
          get_functions(library, data, length)
          return res()
        }

        // otherwise it's a return
        const head = new UInt8Array(socket.read(3))
        const length = head[1] << 8 + head[2]
        const data = new UInt8Array(socket.read(length))

      })
    })

    //first we listen
    server.listen(socket_name)
    //then we run the server
    run_server(library.filetype, library.filename, socket_name)
  })
  
  await function_def_finished
}

function run_server(type, file, socket_name) {
  switch (type) {
    case PY:
      exec(`python ${file} socket=${socket_name}`)
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
  const id = data[s] << 8 + data[++s]
  const slen = data[++s] << 8 + data[++s]
  let name = ""
  for (; s<slen; s++) {
    name += String.fromCharCode(data[s])
  }
  const ret = data[++s]
  const arglen = data[++s] << 8 + data[++s]
  const types = []
  for (; s < arglen; s++) {
    types.push(data[s])
  }
  
  list.push(new Function(types, ret, id, name))
  return s
  
}

function process_return(library, data, length) {
  
}











