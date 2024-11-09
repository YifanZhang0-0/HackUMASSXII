import classes
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
    function_data = map(lambda x: x.encode(), module_meta)
    packet_length = sum(map(lambda x: len(x), function_data))
    output = bytes()

    output += 0xF2.to_bytes(1)
    output += packet_length.to_bytes(4)
    for function_meta_serialized in function_data:
        output += function_meta_serialized
    return output

def write_back(socket_to_client: socket.socket) -> None:
    """Sends the function metadata for the module to the client.

    Args:
        socket_to_client: A socket to the client
    """
    # Note that since the client creates the socket, the client is technically
    # the server at the socket layer.
    socket_to_client.send(classes.encode_module(function_list))
