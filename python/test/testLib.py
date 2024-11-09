from unicall.server import typed, serve

@typed('array', 'int', returns='object')
def hello(comma, counter):
    pass

def world(exclamation):
    pass

serve()
