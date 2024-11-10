from typing import Callable
from unicall.classes import *

interface: list[tuple[FunctionMeta, Callable]] = []
# TODO we use magic global in here, please fix max
def typed(*args, **returns):
    def meta(library_function):
        def switch(str):
            if (str == int): return TypeMeta.INT
            if (str == float): return TypeMeta.FLOAT
            if (str == list): return TypeMeta.ARRAY
            if (str == dict): return TypeMeta.OBJECT
            raise TypeError(f'Unvalid type annotation of: {str}')
  
        arg = list(map(switch, args))
        interface.append((
            FunctionMeta(
                name=library_function.__name__,
                args=arg,
                return_type=switch(returns['returns'])
            ),
            library_function,
        )
        )
        return library_function
    return meta
