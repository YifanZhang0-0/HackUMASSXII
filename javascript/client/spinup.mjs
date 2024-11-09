import * as net from "net"
import * as fs from "fs"

function setup_socket(name, read_callback) {
  if (fs.existsSync(name)) fs.rmSync(name)

  const server = net.createServer((socket) => {
    socket.on("readable", () => read_callback(server))

    socket.on("end", () => console.log("end stream"))
  })

  server.listen(name)
  return server
  
}

function run_server() {
  
}

function get_functions() {
  
}








