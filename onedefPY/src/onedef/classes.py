from enum import IntEnum
import os, os.path

PY="python"
JS="javascript"

class TypeMeta(IntEnum):
    """Represents the numbering scheme that we use to denote types.

    Warning: Since this is just a static namespace, there are no instances of
    `TypeMeta`. For type signatures, use `int` instead and note that these should
    be `TypeMeta` instances in your code.

    The magic numbers are accessed through `TypeMeta`. For example:
    ```python
    print(hex(TypeMeta.INT)) # 0xa1
    ```
    """
    INT = 0xA1
    FLOAT = 0xA2
    STRING = 0xA3
    ARRAY = 0xA4
    OBJECT = 0xA5
    NONE = 0xA6

class FunctionMeta:
    """Represents the metadata for a function, which consists of its name and
    its type signature.
    """
    def __init__(
        self,
        name: str,
        args: list[int],
        return_type: int
    ) -> None:
        """Initializes a `FunctionMeta` instance.

        Args:
            name: A string which represents the name of the function.
            args: A list of integers which represents the type and position of
                the arguments. These numbers should all be in `TypeMeta`.
            return_type: A number from `TypeMeta` that represents the return
                type of the function.
        """
        self.name = name
        self.args = args
        self.return_type = return_type

    def encode(self, id: int) -> bytes:
        """Encodes the function metadata as a byte string.
        
        The function will be encoded as follows:
        | bytes   | field               |
        | :------ | :-----------------: |
        | 2       | id                  |
        | 2       | length of name      |
        | varies  | name                |
        | 1       | return type         |
        | 2       | number of arguments |
        | varies  | argument types      |

        Args:
            id: The id of the function.

        Returns:
            A bytes object representing the manifest for this function.
        """
        output = bytes()

        output += id.to_bytes(2, 'big')
        output += len(self.name).to_bytes(2, 'big')
        output += self.name.encode()
        output += self.return_type.to_bytes(1, 'big')
        output += len(self.args).to_bytes(2, 'big')
        for argument_type in self.args:
            output += argument_type.to_bytes(1, 'big')
        return output

if __name__ == "__main__":
    # These are test cases for this module.
    # TODO: Actually write test cases lol.
    pass

class ReturnData:
    """Represents a returned value ready to be sent back to the client.
    """
    def __init__(self, value: any, destination: int):
        """Initializes a `ReturnData` instance.

        Args:
            value: A value that we want to return.
            destination: An integer representing the ID of the call instance.
        """
        self.value = value
        self.destination = destination

class ErrorValue:
    def __init__(self) -> None:
        pass
