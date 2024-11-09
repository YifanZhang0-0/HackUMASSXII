from asyncio import Future
from enum import IntEnum
import os, os.path
import subprocess
from unicall import coding

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

class Library:
    def __init__(self, filename, filetype):
        self.filename = filename
        self.filetype = filetype
        self.return_id = 0
        self.functions: list[FunctionMeta] = [] # fill this out with spinup
        self.socket = None
        self.waitlist: list[tuple[int, Future]] = []

    def load(self):
        self.spinup()
        
        for func_id, func in self.functions:
            async def method(*params):
                await self.run(func_id, *params)
            setattr(self, func['name'], method)

    async def run(
        self,
        function_id: int,
        *params: list[any],
    ):
        """Sends a function call request to the connection for the library.

        Args:
            function_id: The id for the function that we want to call.
            *params: A list of arguments to send to the function.

        Returns:
            A future that will resolve to the library call result.
        """
        packet = coding.encode_function_call(
            self.functions[function_id],
            function_id,
            self.return_id,
            *params
        )
        # add to waitlist
        res = Future()
        
        self.waitlist.push([self.return_id, res])

        self.return_id += 1

        # send packet
        self.socket.send(packet)

        # wait for waitlist to finish
        r = await res
        return r
       
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
