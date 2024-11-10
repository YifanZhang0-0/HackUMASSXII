#include <stddef.h>
#define PARENS ()

#define EXPAND(...) EXPAND4(EXPAND4(EXPAND4(EXPAND4(__VA_ARGS__))))
#define EXPAND4(...) EXPAND3(EXPAND3(EXPAND3(EXPAND3(__VA_ARGS__))))
#define EXPAND3(...) EXPAND2(EXPAND2(EXPAND2(EXPAND2(__VA_ARGS__))))
#define EXPAND2(...) EXPAND1(EXPAND1(EXPAND1(EXPAND1(__VA_ARGS__))))
#define EXPAND1(...) __VA_ARGS__

#define FOR_EACH(macro, ...)                                    \
  __VA_OPT__(EXPAND(FOR_EACH_HELPER(macro, __VA_ARGS__)))
#define FOR_EACH_HELPER(macro, a1, ...)                         \
  macro(a1)                                                     \
  __VA_OPT__(, FOR_EACH_AGAIN PARENS (macro, __VA_ARGS__))
#define FOR_EACH_AGAIN() FOR_EACH_HELPER

#define FOR_EACH_STMT(macro, ...)                                    \
  __VA_OPT__(EXPAND(FOR_EACH_HELPER_STMT(macro, __VA_ARGS__)))
#define FOR_EACH_HELPER_STMT(macro, a1, ...)                         \
  *((a1 *)decode_request_data(&data, #a1))                           \
  __VA_OPT__(, FOR_EACH_AGAIN_STMT PARENS (macro, __VA_ARGS__))
#define FOR_EACH_AGAIN_STMT() FOR_EACH_HELPER_STMT

struct fancy_return_type{
  void* start;
  size_t length;
  char* type;
  //TODO
};

void *decode_request_data(void **read_head, char *type_label){
  //TODO
}

fancy_return_type encode_return_type(void *data, char *type_label){
  //TODO
}

size_t* manifest_items[512];
size_t manifest_item_lengths[512];
struct fancy_return_type (*manifest_callbacks[512])(void*);
size_t manifest_length = 0;
void append_to_manifest(size_t* manifest_item, size_t length, struct fancy_return_type (*callback)(void*) ){
    manifest_items[manifest_length] = manifest_item;
    manifest_item_lengths[manifest_length] = length;
    manifest_length++;
}

#define MANIFEST_ITEM(...) {FOR_EACH(sizeof, __VA_ARGS__)}

#define CAT(a, ...) PRIMITIVE_CAT(a, __VA_ARGS__)
#define PRIMITIVE_CAT(a, ...) a ## __VA_ARGS__

#define APPEND_TO_MANIFEST(func_name, return_type, ...) \
struct fancy_return_type CAT(_unique_func_, __LINE__)(void* data){ \
  return_type retval = func_name ( FOR_EACH_STMT(IGNORE, __VA_ARGS__) ); \
  return encode_return_data((void *)&retval, #return_type); \
} \
int CAT(_unique_arr_, __LINE__)[] = MANIFEST_ITEM(__VA_ARGS__); \
int CAT(_unique_, __LINE__) = \
append_to_manifest( \
  CAT(_unique_arr_, __LINE__), \
  sizeof(CAT(_unique_arr_, __LINE__)) / sizeof(size_t), \
  &CAT(_unique_func_, __LINE__) \
);
