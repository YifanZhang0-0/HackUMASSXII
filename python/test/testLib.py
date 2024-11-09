from unicall.server.interface import typed

@typed('array', 'int', returns='obj')
def hello(comma, counter):
    pass

def world(exclamation):
    pass