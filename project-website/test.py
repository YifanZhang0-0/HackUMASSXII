from onedef.server import typed, serve

print("running python")

@typed(int, returns=int)
def addfive(a):
    return a+5


@typed(float, list, returns=list)
def addtoarray(a, b):
    return [a+i for i in b]

serve()
