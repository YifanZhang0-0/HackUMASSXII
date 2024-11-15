import * as net from "net"
import * as fs from "fs"
import { exec } from "child_process"
import { Langs } from "../classes.mjs"
import { strict as assert } from "assert"
import { Magic } from "../magic.mjs"


export async function setup_socket(library, socket_name) {
  const function_def_finished = new Promise((res, _) => {

    if (fs.existsSync(socket_name)) fs.rmSync(socket_name)
    library.server = net.createServer((socket) => {
      library.socket = socket
      socket.on("readable", () => {
        const read = socket.read(5)
        if (read == null) return

        const head = new Uint8Array(read)
        const length = (head[1] << 24) + (head[2] << 16) + (head[3] << 8) + head[4]

        assert(head[0] == Magic.FDEF || head[0] == Magic.RET, `invalid header ${head}`)
        const data = new Uint8Array(socket.read(length))
        
        switch (head[0]) {
          case Magic.FDEF:
            library.set_functions(data);
            return res(); 

          case Magic.RET:
            library.process_return(data);
            break;
        }
      })
    })

    library.server.listen(socket_name) //listen before running server
    run_server(library.filetype, library.filename, socket_name)
  })
  
  await function_def_finished
}


function run_server(type, file, socket_name) {
  switch (type) {
    case Langs.PY:
      exec(`python3 ${file} socket=${socket_name} > /tmp/onedef 2>&1`);
      break;

    case Langs.C:
      exec(`./${file} socket=${socket_name} > /tmp/onedef 2>&1`);
      break;

    default:
      throw new Error("bad language")
  }
}

