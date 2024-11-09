def encode_message(funcID, returnID, *args):
    # Ensure input data is at least function ID, return ID, and one argument
    if len(args) < 1:
        raise ValueError("Input data must contain at least function ID, return ID, and one argument")
    
    # Initialize the bytearray
    encoded = bytearray()

    # Encode function ID and return ID (assuming they are small integers, otherwise use more bytes)
    function_id, return_id = funcID, returnID
    encoded.extend(function_id.to_bytes(1, byteorder='big'))
    encoded.extend(return_id.to_bytes(1, byteorder='big'))

    # Encode each argument
    for arg in args:
        if isinstance(arg, int):
            # Encode an integer as 4 bytes 
            arg_bytes = arg.to_bytes(4, byteorder='big')
            arg_type = 1  # Example type indicator for an integer
        elif isinstance(arg, str):
            # Encode a string in UTF-8
            arg_bytes = arg.encode('utf-8')
            arg_type = 2  # Example type indicator for a string
        else:
            raise ValueError(f"Unsupported argument type: {type(arg)}")
        
        # Add type, length, and actual argument bytes
        encoded.extend(arg_type.to_bytes(1, byteorder='big'))  # 1 byte for type
        encoded.extend(len(arg_bytes).to_bytes(1, byteorder='big'))  # 1 byte for length
        encoded.extend(arg_bytes)  # The actual argument data

    return encoded