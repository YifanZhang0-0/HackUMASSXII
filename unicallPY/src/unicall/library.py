from unicall import classes
import asyncio
class Library:
    def __init__(self, filename, filetype):
        self.filename = filename
        self.filetype = filetype
        self.return_id = 0
        self.functions: list[classes.FunctionMeta] = [] # fill this out with spinup
        self.socket = None
        self.waitlist: list[tuple[int, asyncio.Future]] = []

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
