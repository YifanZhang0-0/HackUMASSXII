import * as net from "net"
import * as fs from "fs"
import { exec } from "child_process"
import { PY, JS } from "../coding.mjs"

import { FDEF, INT, FLOAT, STRING, ARRAY, OBJECT } from "../magic.mjs"

function setup_socket(library, socket_name) {
  if (fs.existsSync(socket_name)) fs.rmSync(socket_name)

  const server = net.createServer((socket) => {
    socket.on("readable", () => {
      // first we have to get the functions
      if (library.functions === undefined) {
        const head = new UInt8Array(socket.read(3))
        // TODO: ASSERT HEAD IS 0xF2
        const length = head[1] << 4 + head[2]
        const data = new UInt8Array(socket.read(length))
        get_functions(library, data, length)
        return
      }

      //otherwise it's some type of data
      const head = new UInt8Array(socket.read(3))
      const length = head[1] << 4 + head[2]
      const data = new UInt8Array(socket.read(length))
    
    })
    // socket.on("end", () => console.log("end stream"))
  })

  server.listen(socket_name)
  return server
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
  const id = data[0] << 4 + data[1]
  const strlen = data[2] << 4 + data[3]
  let s = ""
  for (let i=4; i<4+strlen; i++) {
    s += String.fromCharCode(data[i])
  }

  let types = []
  while(i < length) {

    
    
    data[i]
    i++;
  }


  library.functions = []
}








