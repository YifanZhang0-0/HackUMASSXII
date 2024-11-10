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
    
    # Magic number for function call
    packet.extend(b'\xF1')
    
    # Placeholder for size of following data (4 bytes, will update later)
    packet.extend(b'\x00\x00\x00\x00')
    
    # Function ID (2 bytes)
    packet.extend(functionID.to_bytes(2, byteorder='big'))
    
    # Return ID (2 bytes)
    packet.extend(returnID.to_bytes(2, byteorder='big'))

    # Verify the number of arguments matches the FunctionMeta argument length
    if len(args) != len(functions.args):
        raise ValueError(f"Expected {len(functions.args)} arguments but received {len(args)}.")

    # Encode each argument based on the expected types from FunctionMeta
    encoded_args = bytearray()
    for arg, expected_type in zip(args, functions.args):
        if isinstance(arg, int) and expected_type == 0xA1:
            # Encode integer
            encoded_args.extend(b'\xA1' + arg.to_bytes(8, byteorder='big'))
        elif isinstance(arg, float) and expected_type == 0xA2:
            # Encode float
            encoded_args.extend(b'\xA2' + struct.pack('>d', arg))
        elif isinstance(arg, str) and expected_type == 0xA3:
            # Encode string
            string_bytes = arg.encode('utf-8')
            if len(string_bytes) > 65535:
                raise ValueError("String too long to encode with 16-bit length")
            encoded_args.extend(b'\xA3' + len(string_bytes).to_bytes(4, byteorder='big') + string_bytes)
        elif isinstance(arg, list) and expected_type == 0xA4:
            # Encode list
            element_data = b''.join(encoding(elem) for elem in arg)
            encoded_args.extend(b'\xA4' + len(arg).to_bytes(4, byteorder='big') + element_data)
        elif arg is None and expected_type == 0xA6:
            # Encode None
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
    Encoding arguments according to the following scheme:
    A1-int
    A2-float
    A3-string
    A4-Array
    A5-Object
    A6-Null/None
    A7-Error
    B0-return
    Encodes each argument

    Additionally, the packet that is sent will have all the headers in sequential order followed by all the arg_bytes 
    in the same order.

    Returns a byte array that is headers followed by arguements
    """
    # Ensure input data is at least one argument
    if len(args) < 1:
        raise ValueError("Input data must contain at least one argument")
    
    # Initialize two bytearrays: one for headers, one for arg_bytes
    header_section = bytearray()
    data_section = bytearray()

    # Encode each argument
    for arg in args:
        if isinstance(arg, int):
            # Integer encoding (8 bytes)
            header = b'\xA1'
            arg_bytes = arg.to_bytes(8, byteorder='big')
        elif isinstance(arg, float):
            # Float encoding (8 bytes)
            header = b'\xA2'
            arg_bytes = struct.pack('>d', arg)
        elif isinstance(arg, str):
            # String encoding
            header = b'\xA3'
            string_bytes = arg.encode('utf-8')
            length = len(string_bytes)
            if length > 65535:
                raise ValueError("String too long to encode with 16-bit length")
            arg_bytes = length.to_bytes(4, byteorder='big') + string_bytes
        elif isinstance(arg, list):
            # List encoding
            header = b'\xA4'
            length = len(arg)
            if length > 65535:
                raise ValueError("Array too long to encode with 16-bit length")
            element_data = b''.join(encoding(elem) for elem in arg)
            arg_bytes = length.to_bytes(4, byteorder='big') + element_data
        elif isinstance(arg, dict):
            # Dictionary encoding
            header = b'\xA5'
            size = len(arg)
            if size > 65535:
                raise ValueError("Object too large to encode with 16-bit size")
            kv_data = b''
            for key, value in arg.items():
                if not isinstance(key, str):
                    raise ValueError("Object keys must be strings")
                key_data = encoding(key)  # Encode the key (string)
                value_data = encoding(value)  # Encode the value (any supported type)
                kv_data += key_data + value_data
            arg_bytes = size.to_bytes(4, byteorder='big') + kv_data
        elif arg is None:
            # None encoding
            header = b'\xA6'
            arg_bytes = b''  # No data for None type
        elif isinstance(arg, Exception): 
            # function call raises an error
            header = b'\xA7'
            arg_bytes = arg.to_bytes(1, byteorder='big')
        elif isinstance(arg, ReturnData):
            # ReturnData encoding
            header = b'\xB0'
            length = len(arg.elements)
            if length > 65535:
                raise ValueError("Return data too long to encode with 16-bit length")
            element_data = b''.join(encoding(elem) for elem in arg.elements)
            arg_bytes = length.to_bytes(2, byteorder='big') + element_data
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
        decode_result = decode_value(remaining_arguments)
        if decode_result == None:
            raise ValueError(
                f"Tried to process token which"
                f"could not be decoded: {remaining_arguments.hex().upper()}"
            )
        value, value_length = decode_result
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

    if flag == 0xA1: # INT
        if len(data) < 9: return None
        return (int.from_bytes(data[1:9], "big"), 9)

    elif flag == 0xA2: # FLOAT
        if len(data) < 9: return None
        return (struct.unpack('!d', data[1:9])[0], 9)

    elif flag == 0xA3: # STRING
        if len(data) < 5: return None
        string_length = int.from_bytes(data[1:5], "big")

        if len(data) < 5 + string_length: return None
        return (data[5:].decode(), string_length + 5)

    elif flag == 0xA4: # ARRAY
        if len(data) < 5: return None
        array_size = int.from_bytes(data[1:5], "big")
        remaining_data = data[5:]
        key_array = []
        while len(key_array) < array_size:
            decode_result = decode_value(remaining_data)
            if decode_result == None:
                return None
            value, token_length = decode_result
            key_array.append(value)
            remaining_data = remaining_data[token_length:]
        return key_array, len(data) - len(remaining_data)
        
    elif flag == 0xA5: # OBJECT
        if len(data) < 5: return None
        object_size = int.from_bytes(data[1:5])
        remaining_data = data[5:]
        key_array = []
        value_array = []
        while len(key_array) < object_size:
            decode_result = decode_value(remaining_data)
            if decode_result == None:
                return None
            value, token_length = decode_result
            if not isinstance(value, str):
                raise ValueError(
                    f"Non-string key in object {data.hex().upper()}"
                )
            key_array.append(value)
            remaining_data = remaining_data[token_length:]

        while len(value_array) < object_size:
            decode_result = decode_value(remaining_data)
            if decode_result == None:
                return None
            value, token_length = decode_result
            key_array.append(value)
            remaining_data = remaining_data[token_length:]

        decoded_object = {}
        for i in range(object_size):
            decoded_object[key_array[i]] = value_array[i]

        return decoded_object, len(data) - len(remaining_data)

    elif flag == 0xA6: # NONE
        return (None, 1)

    elif flag == 0xA7: # ERROR
        return (ErrorValue, 1)

    else:
        print(f"Error invalid type flag {flag}")

#test encoding with (1) an array and (2) an obj
def main():
    # Test case 1: Encoding an array (list) of mixed types
    array_test = [1, 3.14, "hello", [2, 4, 8], None]
    print("Encoding array:", array_test)
    encoded_array = encoding(array_test)
    print("Encoded array (bytes):", encoded_array)
    print("Encoded array (hex):", encoded_array.hex())
    print()  # Line break between tests

    # Test case 2: Encoding an object (dictionary) with mixed types
    obj_test = {
        "integer": 123,
        "float": 9.81,
        "string": "world",
        "nested_list": [10, 20, 30],
        "nested_dict": {"key1": 42, "key2": "value"},
        "none_value": None
    }
    print("Encoding object:", obj_test)
    encoded_obj = encoding(obj_test)
    print("Encoded object (bytes):", encoded_obj)
    print("Encoded object (hex):", encoded_obj.hex())
    print()  # Line break between tests

if __name__ == "__main__":
    main()
