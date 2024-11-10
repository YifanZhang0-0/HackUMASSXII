#include <stddef.h>
#include "./onedef_functions.hpp"

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

#define FOR_EACH_MANIF(macro, ...)                                    \
  __VA_OPT__(EXPAND(FOR_EACH_HELPER_MANIF(macro, __VA_ARGS__)))
#define FOR_EACH_HELPER_MANIF(macro, a1, ...)                         \
  #a1                                                     \
  __VA_OPT__(, FOR_EACH_AGAIN_MANIF PARENS (macro, __VA_ARGS__))
#define FOR_EACH_AGAIN_MANIF() FOR_EACH_HELPER_MANIF

#define FOR_EACH_STMT(macro, ...)                                    \
  __VA_OPT__(EXPAND(FOR_EACH_HELPER_STMT(macro, __VA_ARGS__)))
#define FOR_EACH_HELPER_STMT(macro, a1, ...)                         \
  *((a1 *)(args[i++]))                           \
  __VA_OPT__(, FOR_EACH_AGAIN_STMT PARENS (macro, __VA_ARGS__))
#define FOR_EACH_AGAIN_STMT() FOR_EACH_HELPER_STMT

int append_to_manifest(const char *func_name, const char *return_type, const char** arg_types, size_t length, struct fancy_return_type (*callback)(std::vector<char*>)){
    manifest_names[manifest_length] = func_name;
    manifest_returns[manifest_length] = return_type;
    manifest_items[manifest_length] = arg_types;
    manifest_item_lengths[manifest_length] = length;
    manifest_callbacks[manifest_length] = callback;
    manifest_length++;
    return 0;
}

#define MANIFEST_ITEM(...) {FOR_EACH_MANIF(IGNORE_ME, __VA_ARGS__)}

#define CAT(a, ...) PRIMITIVE_CAT(a, __VA_ARGS__)
#define PRIMITIVE_CAT(a, ...) a ## __VA_ARGS__

#define APPEND_TO_MANIFEST(func_name, return_type, ...) \
struct fancy_return_type CAT(_unique_func_, __LINE__)(std::vector<char*> args){ \
  int i = 0; \
  auto retval = func_name ( FOR_EACH_STMT(IGNORE, __VA_ARGS__) ); \
  return encode_return_data((void *)(new auto(retval)), #return_type); \
} \
const char * CAT(_unique_arr_, __LINE__)[] = MANIFEST_ITEM(__VA_ARGS__); \
int CAT(_unique_, __LINE__) = \
append_to_manifest( \
  #func_name, \
  #return_type, \
  CAT(_unique_arr_, __LINE__), \
  sizeof(CAT(_unique_arr_, __LINE__)) / sizeof(size_t), \
  &CAT(_unique_func_, __LINE__) \
);
