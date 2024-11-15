from onedef.server import typed, serve

@typed(int, returns=int)
def pass_int(a): return a

@typed(float, returns=float)
def pass_float(a): return a

@typed(str, returns=str)
def pass_string(a): return a

@typed(list, returns=list)
def pass_array(a): return a

@typed(dict, returns=dict)
def pass_object(a): return a

# @typed(returns=int)
# def take_none():
    # return 1

# @typed(int, returns=None)
# def return_none(a):
    # ...

serve()
