#include "./unicall.h"

float square(int a){
    return a * a;
}

APPEND_TO_MANIFEST(square, float, int)

int main(int argc, char *argv[]){
    printf("function: %s\n", manifest_names[0]);
    printf("socket: %s\n", argv[1]);
    if(argc < 2){
        printf("Usage test <socket name>");
        return 1;
    }
    server_init(argv[1] + 7);
}