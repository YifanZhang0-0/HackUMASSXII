import struct

def encode_function_call(functionID, returnID, *args):
    """
    Encodes a function call packet with a given functionID, returnID, and arguments.
    This function formats the packet headers according to the specified structure.

    Parameters:
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
    
    # Encode arguments using the original encoding function
    args_encoded = encoding(*args)  # Calls your original encoding function
    
    # Append the encoded arguments to the packet
    packet.extend(args_encoded)
    
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
            arg_bytes = length.to_bytes(2, byteorder='big') + string_bytes
        elif isinstance(arg, list):
            # List encoding
            header = b'\xA4'
            length = len(arg)
            if length > 65535:
                raise ValueError("Array too long to encode with 16-bit length")
            element_data = b''.join(encoding(elem) for elem in arg)
            arg_bytes = length.to_bytes(2, byteorder='big') + element_data
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
            arg_bytes = size.to_bytes(2, byteorder='big') + kv_data
        elif arg is None:
            # None encoding
            header = b'\xA6'
            arg_bytes = b''  # No data for None type
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

# Custom class to represent the "Return" data
class ReturnData:
    def __init__(self, elements):
        self.elements = elements

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
