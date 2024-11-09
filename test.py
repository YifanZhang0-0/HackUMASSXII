from unicall.server import typed, serve

@typed('int', returns='int')
def addfive(a):
    return a+5

serve()
