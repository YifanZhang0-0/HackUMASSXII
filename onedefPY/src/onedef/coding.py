import struct
from onedef.classes import ReturnData, ErrorValue

def encode_function_call(functions, functionID, returnID, *args):
    """
    Encodes a function call packet with a given functionID, returnID, and arguments.
    This function formats the packet headers according to the specified structure.

    Parameters:
    - functions (FunctionMeta): 
    - functionID (int): ID of the function being called.
    - returnID (int): ID for the return data.
    - *args: Variable length argument list of function parameters.

    Returns:
    - bytearray: Encoded function call packet with headers followed by encoded arguments.
    """
    # Initialize the header section
    packet = bytearray()
    packet.extend(b'\xF1\x00\x00\x00\x00')
    packet.extend(functionID.to_bytes(2, byteorder='big'))
    packet.extend(returnID.to_bytes(2, byteorder='big'))

    # Verify the number of arguments matches the FunctionMeta argument length
    assert len(args) == len(functions.args), f"Expected {len(functions.args)} arguments but received {len(args)}."

    # Encode each argument based on the expected types from FunctionMeta
    encoded_args = bytearray()
    for arg, expected_type in zip(args, functions.args):
        if isinstance(arg, int) and expected_type == 0xA1:
            encoded_args.extend(b'\xA1' + arg.to_bytes(8, byteorder='big'))

        elif isinstance(arg, float) and expected_type == 0xA2:
            encoded_args.extend(b'\xA2' + struct.pack('>d', arg))

        elif isinstance(arg, str) and expected_type == 0xA3:
            string_bytes = arg.encode('utf-8')
            assert len(string_bytes) <= 65536, "cannot encode string with length greater than 16 bits"
            encoded_args.extend(b'\xA3' + len(string_bytes).to_bytes(4, byteorder='big') + string_bytes)

        elif isinstance(arg, list) and expected_type == 0xA4:
            element_data = b''.join(encoding(elem) for elem in arg)
            encoded_args.extend(b'\xA4' + len(arg).to_bytes(4, byteorder='big') + element_data)

        elif arg is None and expected_type == 0xA6:
            encoded_args.extend(b'\xA6')

        else:
            raise ValueError(f"Argument type {type(arg)} does not match expected type {expected_type}.")

    # Append encoded arguments to the packet
    packet.extend(encoded_args)
    
    # Calculate the size of the following data (everything after the first 5 bytes)
    size_of_data = len(packet) - 5  # Exclude the magic number and size placeholder
    packet[1:5] = size_of_data.to_bytes(4, byteorder='big')
    
    return packet

def encoding(*args):
    """
    Returns a byte array that is headers followed by arguements
    """
    
    # Initialize two bytearrays: one for headers, one for arg_bytes
    header_section = bytearray()
    data_section = bytearray()

    # Encode each argument
    for arg in args:
        if isinstance(arg, int):
            header = b'\xA1'
            arg_bytes = arg.to_bytes(8, byteorder='big', signed=True)

        elif isinstance(arg, float):
            header = b'\xA2'
            arg_bytes = struct.pack('>d', arg)

        elif isinstance(arg, str):
            header = b'\xA3'
            string_bytes = arg.encode('utf-8')
            length = len(string_bytes)
            assert length <= 65536, "cannot encode string with length greater than 16 bits"
            arg_bytes = length.to_bytes(4, byteorder='big') + string_bytes

        elif isinstance(arg, list):
            header = b'\xA4'
            length = len(arg)
            assert length <= 65536, "cannot encode array with length greater than 16 bits"
            element_data = b''.join(encoding(elem) for elem in arg)
            arg_bytes = length.to_bytes(4, byteorder='big') + element_data

        elif isinstance(arg, dict):
            header = b'\xA5'
            size = len(arg)
            assert size <= 65536, "cannot encode object with length greater than 16 bits"
            arg_bytes = size.to_bytes(4, byteorder='big')
            for key in arg.keys():
                arg_bytes += encoding(key)
            for value in arg.values():
                arg_bytes += encoding(value)

        elif arg is None:
            header = b'\xA6'
            arg_bytes = b''

        elif isinstance(arg, Exception): 
            header = b'\xA7'
            arg_bytes = b''

        else:
            raise ValueError(f"Unsupported argument type: {type(arg)}")

        # Append only the header to the header_section
        header_section.extend(header)

        # Append actual data to data_section
        data_section.extend(arg_bytes)

    # Combine headers and data into final encoded format
    return header_section + data_section

def encode_return_data(return_data: ReturnData) -> bytes:
    """Encodes a `ReturnData` instance as a byte string.
    """
    output = bytes()
    output += return_data.destination.to_bytes(2, "big")
    output += encoding(return_data.value)
    output = len(output).to_bytes(4, "big") + output
    output = b"\xb0" + output

    return output

def decode_function_request(data: bytes) -> tuple[int, int, list[any]]:
    """Decodes a function packet.

    Args:
        data: The full function call packet as defined in the IPC spec.
    
    Returns:
        A tuple (function_id, return_id, arguments), where function_id is the id
        of the function that we want to call, return_id is the id the we want to
        return to, and arguments is the list of function arguments.
    """
    function_id = int.from_bytes(data[5:7], 'big')
    return_id = int.from_bytes(data[7:9], 'big')
    argument_data = data[9:]
    arguments = []
    remaining_arguments = argument_data
    while len(remaining_arguments) > 0:
        [value, value_length] = decode_value(remaining_arguments)
        arguments.append(value)
        remaining_arguments = remaining_arguments[value_length:]
    return function_id, return_id, arguments

def decode_value(data: bytes) -> tuple[any, int] | None:
    """Decodes the first data value in a byte string of data values

    Args:
        data: The bytestring that we want to read from.

    Returns:
        If the decoding fails due to lack of information, this function returns
        none. Otherwise, this function returns (value, length), where value is
        the first value contained in the data, and length is the length of the
        value within the data string
    """
    if len(data) < 1: return None
    flag = data[0]

    if flag == 0xA1:
        return (int.from_bytes(data[1:9], "big", signed=True), 9)
        
    elif flag == 0xA2:
        return (struct.unpack('!d', data[1:9])[0], 9)

    elif flag == 0xA3:
        string_length = int.from_bytes(data[1:5], "big")
        return (data[5:5+string_length].decode(), string_length + 5)

    elif flag == 0xA4:
        array_size = int.from_bytes(data[1:5], "big")
        remaining_data = data[5:]
        key_array = []
        while len(key_array) < array_size:
            [value, token_length] = decode_value(remaining_data)
            key_array.append(value)
            remaining_data = remaining_data[token_length:]
        return (key_array, len(data) - len(remaining_data))
        
    elif flag == 0xA5:
        object_size = int.from_bytes(data[1:5])
        remaining_data = data[5:]
        key_array = []
        value_array = []
        while len(key_array) < object_size:
            [value, token_length] = decode_value(remaining_data)
            assert isinstance(value, str), f"Non-string key in object {data.hex().upper()}"
            key_array.append(value)
            remaining_data = remaining_data[token_length:]

        while len(value_array) < object_size:
            decode_result = decode_value(remaining_data)
            value, token_length = decode_result
            value_array.append(value)
            remaining_data = remaining_data[token_length:]

        decoded_object = {}
        for i in range(object_size):
            decoded_object[key_array[i]] = value_array[i]

        print(decoded_object)

        return (decoded_object, len(data) - len(remaining_data))

    elif flag == 0xA6: # NONE
        return (None, 1)

    elif flag == 0xA7: # ERROR
        return (ErrorValue, 1)

    else:
        raise Exception(f"Error invalid type flag {flag}")
