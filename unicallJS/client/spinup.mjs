import * as net from "net"
import * as fs from "fs"
import { exec } from "child_process"
import { Function, PY } from "../classes.mjs"

export async function setup_socket(library, socket_name) {
  const function_def_finished = new Promise((res, _) => {

    if (fs.existsSync(socket_name)) fs.rmSync(socket_name)
    const server = net.createServer((socket) => {
      socket.on("readable", () => {
        console.log("reading")
        // first we have to get the functions
        if (library.functions === undefined) {
          console.log("writing functions")
          const head = new UInt8Array(socket.read(5))
          // TODO: ASSERT HEAD IS 0xF2
          const length = head[1] << 24 + head[2] << 16 + head[3] << 8 + head[4]
          const data = new UInt8Array(socket.read(length))
          get_functions(library, data, length)
          return res()
        }

        // otherwise it's a return
        // TODO: assert head is 0xF1
        const head = new UInt8Array(socket.read(5))
        const length = head[1] << 24 + head[2] << 16 + head[3] << 8 + head[4]
        const data = new UInt8Array(socket.read(length))
        process_return(library, data, length)
      })
    })

    //first we listen
    console.log("listening")
    server.listen(socket_name)
    //then we run the server
    console.log("running server")
    run_server(library.filetype, library.filename, socket_name)
  })
  
  await function_def_finished
}

function run_server(type, file, socket_name) {
  switch (type) {
    case PY:
      exec(`python ${file} socket=${socket_name}`, (error, stdout, stderr) => {
        console.log(stdout)
      })
      console.log("execed")
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

function process_return(library, data) {
  let s=0
  const retid = data[s] << 8 + data[++s]
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










