#include "./onedef_macros.hpp"

double square(long a){
    printf("Called me! %d", a);
    return (double)(a * a);
}

double mul(long a, long b){
    return a * b;
}

APPEND_TO_MANIFEST(square, double, long)
APPEND_TO_MANIFEST(mul, double, long, long)

int main(int argc, char *argv[]){
    printf("function: %s\n", manifest_names[0]);
    printf("socket: %s\n", argv[1]);
    if(argc < 2){
        printf("Usage test <socket name>");
        return 1;
    }
    server_init(argv[1] + 7);
}