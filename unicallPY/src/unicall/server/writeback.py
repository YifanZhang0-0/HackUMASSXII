from unicall import classes
from unicall.server import interface
import socket
# import file_list

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
    function_list = map(lambda x: x[0], interface.interface)
    socket_to_client.send(classes.encode_module(function_list))

if __name__ == "__main__":
    # These are test cases for this module.
    my_module = [
        classes.FunctionMeta(
            name="foo",
            args=[
                classes.TypeMeta.INT,
            ],
            return_type=classes.TypeMeta.INT,
        ),
        classes.FunctionMeta(
            name="bar",
            args=[
                classes.TypeMeta.STRING,
                classes.TypeMeta.STRING,
            ],
            return_type=classes.TypeMeta.NONE,
        ),
    ]
    data = encode_module(my_module)
    expected_serialization = "F20000001700000003666F6FA10001A100010003626172A60002A3A3"
    if data.hex().upper() != expected_serialization:
        print("encode_module returned an incorrect serialization")
        print(f"got:      {data.hex().upper()}")
        print(f"expected: {expected_serialization}")
        # F20000001700000003666F6FA10001A100010003626172A60002A3A3
        #
        # F2: magic
        # 00000017: length
        # 0000: id
        # 0003: len("foo")
        # 666F6F: "foo"
        # A1: returns INT
        # 0001: 1 parameter
        # A1: takes INT
        # 0001: id
        # 0003: len("bar")
        # 626172: "bar"
        # A6: returns NONE
        # 0002: 2 parameters
        # A3A3: takes STR and STR
