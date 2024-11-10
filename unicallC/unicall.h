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

size_t* manifest_items[512];
size_t manifest_item_lengths[512];
size_t manifest_length = 0;
void append_to_manifest(size_t* manifest_item, size_t length){
    manifest_items[manifest_length] = manifest_item;
    manifest_item_lengths[manifest_length] = length;
    manifest_length++;
}

#define MANIFEST_ITEM(...) {FOR_EACH(sizeof, __VA_ARGS__)}

#define CAT(a, ...) PRIMITIVE_CAT(a, __VA_ARGS__)
#define PRIMITIVE_CAT(a, ...) a ## __VA_ARGS__

#define APPEND_TO_MANIFEST(...) int CAT(asjnaowvnevnaeron, __LINE__) = append_to_manifest(MANIFEST_ITEM(__VA_ARGS__), sizeof(MANIFEST_ITEM(__VA_ARGS__)) / sizeof(size_t))
