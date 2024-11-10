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
# 415 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
typedef struct {
  long long __max_align_ll __attribute__((__aligned__(__alignof__(long long))));
  long double __max_align_ld __attribute__((__aligned__(__alignof__(long double))));
# 426 "/usr/lib/gcc/x86_64-linux-gnu/11/include/stddef.h" 3 4
} max_align_t;






  typedef decltype(nullptr) nullptr_t;
# 2 "./unicall.h" 2
# 24 "./unicall.h"

# 24 "./unicall.h"
struct fancy_return_type{
  void* start;
  size_t length;
  char* type;

};

void *decode_request_data(void **read_head, char *type_label){

}

fancy_return_type encode_return_type(void *data, char *type_label){

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
# 2 "test.c" 2





struct fancy_return_type _unique_func_7(void* data){ float retval = example_function ( *((int *)decode_request_data(&data, "int")) , *((float *)decode_request_data(&data, "float")) , *((double *)decode_request_data(&data, "double")) ); return encode_return_data((void *)&retval, "float"); } int _unique_arr_7[] = {sizeof(int) , sizeof(float) , sizeof(double)}; int _unique_7 = append_to_manifest( _unique_arr_7, sizeof(_unique_arr_7) / sizeof(size_t), &_unique_func_7 );
