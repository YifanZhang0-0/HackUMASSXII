import { Function } from "../classes.mjs"
import { INT, FLOAT, STRING, ARRAY, OBJECT, FLOAT } from "../magic.mjs"
import * as net from "net"
import { decode_function } from "../coding.mjs"

function serve(functions) {

  // if we have no argument, return, otherwrise get socket
  let socket_name = undefined
  process.argv.forEach((a, i) => {
    if (i < 2) return // ignore first two
    let match = a.match(/sock=(.*)/)
    if (match == null) return
    socket_name = match[1]
  })

  // no argument? return
  if (socket_name === undefined) return
  const funclist = []
  
  let id = 0;
  for (const [func, types, ret] of functions) {
    funclist.push(new Function(types, ret, id++, func.name, exec))
  }

  // establish socket
  const socket = net.createConnection(socket_name)

  // write all functions to socket
  socket.write(encode_fdef(funclist))

  // now listen for function calls
  socket.on("readable", async () => {
    const head = new UInt8Array(socket.read(5))
    const length = head[1] << 24 + head[2] << 16 + head[3] << 8 + head[4]
    const data = new UInt8Array(socket.read(length))
    call_function(data)
  })
}


async function call_function(data, funclist, socket) {
  let [id, retid, params] = decode_function(data)
  // find the function
  const func = funclist.find(a => a.id == id)
  // if func doesn't exist, die
  if (!func) {
    console.log(`bad id ${id}`)
    return error(socket)
  }

  // call the function
  let res = undefined
  try {
    res = await func.exec(...params)
  } catch (e) {
    console.log(`function ${id} errored out:\n${e}`)
    return error(socket)
  }

  // send back the result
  let packet = undefined
  try {
    packet = encode_return(retid, res, func.type)
  } catch (e) {
    console.log(`encode failed for ${id}:\n${e}`)
  }
  socket.send(packet)
}

function error(socket) {
  socket.send(new UInt8Array([0xA, 0x7]))
}


