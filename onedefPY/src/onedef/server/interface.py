from typing import Callable
from onedef.classes import *

interface: list[tuple[FunctionMeta, Callable]] = []
# TODO we use magic global in here, please fix max
def typed(*args, **returns):
    def meta(library_function):
        def switch(s):
            if (s == int): return TypeMeta.INT
            if (s == float): return TypeMeta.FLOAT
            if (s == str): return TypeMeta.STRING
            if (s == list): return TypeMeta.ARRAY
            if (s == dict): return TypeMeta.OBJECT
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
