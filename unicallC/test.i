# 0 "test.c"
# 0 "<built-in>"
# 0 "<command-line>"
# 1 "/usr/include/stdc-predef.h" 1 3 4
# 0 "<command-line>" 2
# 1 "test.c"
# 1 "./unicall.h" 1
# 1 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 1 3 4
# 143 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4

# 143 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
typedef long int ptrdiff_t;
# 209 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
typedef long unsigned int size_t;
# 321 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
typedef int wchar_t;
# 415 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
typedef struct {
  long long __max_align_ll __attribute__((__aligned__(__alignof__(long long))));
  long double __max_align_ld __attribute__((__aligned__(__alignof__(long double))));
# 426 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
} max_align_t;
# 2 "./unicall.h" 2
# 17 "./unicall.h"

# 17 "./unicall.h"
size_t* manifest_items[512];
size_t manifest_item_lengths[512];
size_t manifest_length = 0;
void append_to_manifest(size_t* manifest_item, size_t length){
    manifest_items[manifest_length] = manifest_item;
    manifest_item_lengths[manifest_length] = length;
    manifest_length++;
}
# 2 "test.c" 2

{sizeof(int) , sizeof(float) , sizeof(double)}

{sizeof(int) , sizeof(int) , sizeof(float) , sizeof(bool)}

int asjnaowvnevnaeron7 = append_to_manifest({sizeof(int) , sizeof(float) , sizeof(double)}, sizeof({sizeof(int) , sizeof(float) , sizeof(double)}) / sizeof(size_t))
