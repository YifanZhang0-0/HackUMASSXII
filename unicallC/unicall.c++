#include "unicall.h"
#include <string>
#include <vector>
#include <list>
using namespace std;

struct function {
  list<uint8_t> types;
  uint8_t ret;
  uint16_t id;
  char *name;
  void *exec;
};

vector<function> functions;


void 




