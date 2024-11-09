import asyncio
import socket
from typing import Callable
from unicall import classes
from unicall import coding
from unicall.server import interface

# TODO: update this to the ReturnData type
pending_returns = list[any]
functions = list[Callable]

async def handle_packet(
    socket: socket.socket,
    return_id: int,
    function_id: int,
    *args: list[1]
):
    """Handles a single packet request

    Args:
        socket: The socket to return to.
        return_id: The id to return to.
        function_id: The function to run.
    """
    _metadata, func = interface.interface[function_id]
    return_value = await func(*args)
    socket.send(classes.ReturnData(
        value=return_value,
        destination=return_id,
    ))
    
def serve(socket_to_client: socket.socket):
    """Starts the event loop for the server
    
    Args:
        socket_to_client: A socket that the server is already connected to.
            This is the socket that the server will talk to.
    """
    async def inner():
        while True:
            data = bytes()
            data += await socket_to_client.recv(5)
            remaining_length = int.from_bytes(data[1:5], 'big')
            data += await socket_to_client.recv(remaining_length)
            
            function_id, return_id, arguments = coding.decode_function_request(data)
            handle_packet(
                socket=socket_to_client,
                return_id=return_id,
                function_id=function_id,
                *arguments,
            )
    asyncio.run(inner)
