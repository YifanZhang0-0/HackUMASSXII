from unicall import classes
import socket
# import file_list

# TODO: replace this with some code that actually fetches the list of exported
# functions.
function_list: list[classes.FunctionMeta]

def encode_module(module_meta: list[classes.FunctionMeta]):
    """Encodes the public interface for a module as a byte string.

    Writes the names and type signatures for every externally callable function
    in a module into a byte string.
    
    Args:
        module_meta: A list of `FunctionMeta` instances that represents the
            module that we want the client to be able to use.
            
    Returns:
        A byte string that represents our module interface.
    """
    output = bytes()

    for id, function_meta in enumerate(module_meta):
        output += function_meta.encode(id)
    output = len(output).to_bytes(4, 'big') + output
    output = 0xF2.to_bytes(1, 'big') + output
    return output

def write_back(socket_to_client: socket.socket) -> None:
    """Sends the function metadata for the module to the client.

    Args:
        socket_to_client: A socket to the client
    """
    # Note that since the client creates the socket, the client is technically
    # the server at the socket layer.
    socket_to_client.send(classes.encode_module(function_list))
