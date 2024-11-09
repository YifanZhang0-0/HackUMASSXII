import os
import socket
import struct
import subprocess
from unicall import classes
from unicall import coding

def setup_socket(
    library: classes.Library,
    socket_name: str,
):
    """Entry point for using a Library object.

    This library creates the socket, starts up the server, and handles responses
    from the server.

    Args:
        library: A Library object representing the library interface that we
            will send our resolutions to.
        socket_name: The name of the socket that we want ot create.
    """
    # Remove the socket file if it already exists
    if os.path.exists(socket_name):
        os.remove(socket_name)
    
    # Create a UNIX socket
    server_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server_socket.bind(socket_name)
    server_socket.listen()

    # Run the server
    run_server(library, socket_name)

    # Accept and handle connections
    while True:
        conn, _ = server_socket.accept()
        with conn:
            library.socket = conn
            while True:
                header = conn.recv(5)
                if not header:
                    break
                
                # Parse header to check message type and length
                msg_type = header[0]
                length = (header[1] << 24) + (header[2] << 16) + (header[3] << 8) + header[4]
                data = conn.recv(length)

                # Handle function definitions or return data based on msg_type
                if msg_type == 0xF2:
                    get_functions(library, data)
                elif msg_type == 0xF1:
                    process_return(library, data)

def run_server(
    library: classes.Library,
    socket_name: str,
):
    """Launches the subprocess for an RPC server.

    Args:
        library: The library that we want to host.
        socket_name: The socket that the server should interface with.
    """
    if (library.filename[-4:] == ".mjs" or
        library.filename[-3:] == ".js"):
        subprocess.Popen(["node", library.filename, f"socket={socket_name}"])

def get_functions(
    library: classes.Library,
    data: bytes,
):
    """Populates a Library object using a library manifest packet.

    Args:
        library: The library that we want to populate.
        data: The bit string that we want to read from.
    """
    library.functions = []
    head_index = 0
    while head_index < len(data):
        head_index = get_function(library.functions, data, head_index)

def get_function(
    function_list: list[classes.FunctionMeta],
    data: bytes,
    head_index: int,
):
    """Reads a function metadata from a segment of data and populates an array.

    This reads the data segment as if it were a tape and we have the head at a
    specific position.

    Args:
        function_list: A list of function metadata elements. We will mutate this
            array.
        data: The data segment that we want to read.
        head_index: The original head position.

    Returns:
        The new head position.
    """
    id = int.from_bytes(data[head_index: head_index + 2], byteorder="big")
    head_index += 2

    name_len = int.from_bytes(data[head_index: head_index + 2], byteorder="big")
    head_index += 2

    name = data[head_index:head_index+name_len].decode('utf-8')
    head_index += name_len

    return_type = data[head_index]
    head_index += 1

    argument_length = int.from_bytes(
        data[head_index: head_index + 2],
        byteorder="big",
    )
    head_index += 2

    argument_list = list(data[head_index:head_index+argument_length])
    head_index += argument_length

    decoded_function = classes.FunctionMeta(
        name=name,
        args=argument_list,
        return_type=return_type,
    )
    if id == len(function_list):
        function_list.append(decoded_function)
    else:
        print("The ids in the function manifest aren't in order. This isn't a "
              "logical error, but this probably indicates something breaking")
        padding_needed = id - len(function_list) + 1
        if padding_needed > 0:
            function_list.extend([None] * padding_needed)
        if function_list[id] != None:
            raise ValueError(f"Duplicate id: {id}")
        function_list[id] = decoded_function
    return head_index

def process_return(
    library: classes.Library,
    data: bytes
):
    """Process a segment of data representing a returned value.

    This will call the callback for a given pending function.

    Args:
        library: The library interface that we want to to return to.
        data: The data that we want to process.
    """
    s = 0
    return_id = (data[s] << 8) + data[s+1]
    s += 2
    value, _ = coding.decode_value(data[s:])  # Assuming a decode function that handles data

        
    matching_index = -1
    for i, (callback_id, callback) in enumerate(library.waitlist):
        if callback_id == return_id:
            if isinstance(value, classes.ErrorValue):
                callback.set_exception()
            matching_index = i
            callback.set_result(value)
            break
        
    if matching_index == -1:
        raise ValueError(f"Return ID {return_id} not found in waitlist")
    else:
        library.waitlist.pop(matching_index)

# Main function to run the server setup
def main():
    library = classes.Library()
    library.filename = "script.py"  # The Python script to run
    socket_name = "/tmp/my_socket"

    try:
        setup_socket(library, socket_name)
    finally:
        if os.path.exists(socket_name):
            os.remove(socket_name)

if __name__ == "__main__":
    main()