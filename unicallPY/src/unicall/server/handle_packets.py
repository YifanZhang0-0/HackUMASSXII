import asyncio
import socket
import sys
from typing import Callable
from unicall import classes
from unicall import coding
from unicall.server import interface
from unicall.server import writeback
import threading


# TODO: update this to the ReturnData type
pending_returns = list[any]
functions = list[Callable]

async def handle_packet(
    socket: socket.socket,
    return_id: int,
    function_id: int,
    *args
):
    """Handles a single packet request

    Args:
        socket: The socket to return to.
        return_id: The id to return to.
        function_id: The function to run.
    """
    _metadata, func = interface.interface[function_id]
    return_value = None
    try:
        if (asyncio.iscoroutinefunction(func)):
            return_value = await func(*args)
        else:
            return_value = func(*args)
    except Exception as e:
        return_value = e

    socket.send(coding.encode_return_data(classes.ReturnData(
        value=return_value,
        destination=return_id,
    )))
    
def serve():
    """Serves the RPC server on the socket in sys.argv[1].
    """
    socket_to_client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    if sys.argv[1][:7] != "socket=":
        raise "Bad"
    socket_to_client.connect(sys.argv[1][7:])
    writeback.write_back(socket_to_client=socket_to_client)

    def inner(socket_to_client):
        while True:
            data = bytes()
            data += socket_to_client.recv(5)
            if data == b'':
                break

            remaining_length = int.from_bytes(data[1:5], 'big')
            data += socket_to_client.recv(remaining_length)
                
            function_id, return_id, arguments = coding.decode_function_request(data)

            asyncio.run(handle_packet(socket_to_client, return_id, function_id, *arguments))

    threading.Thread(target=inner, args=(socket_to_client,)).start()
