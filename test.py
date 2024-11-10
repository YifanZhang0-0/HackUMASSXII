from unicall.server import typed, serve

print("running python")

@typed('int', returns='int')
def addfive(a):
    return a+5


@typed('float', 'array', returns='array')
def addtoarray(a, b):
    return [a+i for i in b]

serve()
