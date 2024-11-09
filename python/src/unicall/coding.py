import struct

def encoding(*args):
    # Ensure input data is at least function ID, return ID, and one argument
    if len(args) < 1:
        raise ValueError("Input data must contain at least function ID, return ID, and one argument")
    
    # Initialize the bytearray
    encoded = bytearray()

    # Encode function ID and return ID (assuming they are small integers, otherwise use more bytes)
    # function_id, return_id = funcID, returnID
    # encoded.extend(function_id.to_bytes(1, byteorder='big'))
    # encoded.extend(return_id.to_bytes(1, byteorder='big'))

    # Encode each argument
    for arg in args:
        if isinstance(arg, int):
            # Encode an integer as 4 bytes 
            header = b'\xA1'  # Header byte (0xA1)
            arg_bytes = header + arg.to_bytes(8, byteorder='big')
            # arg_type = 0xA1  # Example type indicator for an integer
        elif isinstance(arg, float):
            # Encode a float as 8 bytes (double precision)
            header = b'\xA2'
            arg_bytes = header + struct.pack('>d', arg)
            # arg_type = 0xA3  # Example type indicator for a float
        elif isinstance(arg, str):
            # Encode a string in UTF-8
            header = b'\xA3'
            string_bytes = arg.encode('utf-8')
            length = len(string_bytes)
            if length > 65535:
                raise ValueError("String too long to encode with 16-bit length")
            arg_bytes = header + length.to_bytes(2, byteorder='big') + string_bytes
            # arg_type = 0xA3  # Example type indicator for a string
        elif isinstance(arg, list):
            # Array case: 2-byte header (0xA4) + 2-byte length + encoded elements
            header = b'\xA4'
            length = len(arg)
            if length > 65535:
                raise ValueError("Array too long to encode with 16-bit length")
            element_data = b''.join(encoding(elem) for elem in arg)
            return header + length.to_bytes(2, byteorder='big') + element_data
        elif isinstance(arg, dict):
            # Object case: 2-byte header (0xA5) + 2-byte size + encoded key-value pairs
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
            return header + size.to_bytes(2, byteorder='big') + kv_data
        elif arg is None:
            # Null/None case: 2-byte header (0xA6)
            return b'\xA6'
        elif isinstance(arg, ReturnData):
            # Return case: 2-byte header (0xB0) + 2-byte length + encoded elements
            header = b'\xB0'
            length = len(arg.elements)
            if length > 65535:
                raise ValueError("Return data too long to encode with 16-bit length")
            element_data = b''.join(encoding(elem) for elem in arg.elements)
            return header + length.to_bytes(2, byteorder='big') + element_data
        else:
            raise ValueError(f"Unsupported argument type: {type(arg)}")
        
        # Add type, length, and actual argument bytes
        # encoded.extend(arg_type.to_bytes(1, byteorder='big'))  # 1 byte for type
        encoded.extend(len(arg_bytes).to_bytes(1, byteorder='big'))  # 1 byte for length
        encoded.extend(arg_bytes)  # The actual argument data

    return encoded

# Custom class to represent the "Return" data
class ReturnData:
    def __init__(self, elements):
        self.elements = elements