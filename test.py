from unicall.server import typed, serve

print("running python")

@typed('int', returns='int')
def addfive(a):
    return a+5

serve()
