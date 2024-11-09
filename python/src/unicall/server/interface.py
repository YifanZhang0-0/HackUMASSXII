from unicall.classes import *

# TODO we use magic global in here, please fix max
def typed(*args, **returns):
    def meta(function):
        def switch(str):
            match str:
                case 'int':
                    return TypeMeta.INT
                case 'float':
                    return TypeMeta.FLOAT
                case 'array':
                    return TypeMeta.ARRAY
                case 'object':
                    return TypeMeta.OBJECT
                case _:
                    raise TypeError(f'Unvalid type annotation of: {str}')
  
        arg = list(map(switch, args))
        print(vars(FunctionMeta(function.__name__, arg, returns['returns'])))
        return function
    return meta


if __name__ == "__main__":
    # These are test cases for this module.
    print(load_functions('../../../test/testLib.py'))
