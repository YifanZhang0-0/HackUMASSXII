#include <stddef.h>
#include <stdio.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <string.h>

const char* manifest_names[512];
const char* manifest_returns[512];
const char** manifest_items[512];
size_t manifest_item_lengths[512];
struct fancy_return_type (*manifest_callbacks[512])(void*);
size_t manifest_length = 0;

char string_to_type(const char* name){
  if(strcmp(name, "int") != 0) return 0xA1;
  if(strcmp(name, "float") != 0) return 0xA2;
  if(strcmp(name, "char*") != 0) return 0xA3;
}

struct fancy_return_type{
  void* start;
  size_t length;
  char* type;
  //TODO
};

void *decode_request_data(void **read_head, const char *type_label){
  //TODO
}

struct fancy_return_type encode_return_data(void *data, const char *type_label){
  //TODO
}

void send_manifest(int socket_id){
    int total_length = 5;
    for(int i = 0; i < manifest_length; i++){
        total_length += 7;
        total_length += strlen(manifest_names[i]);
        total_length += manifest_item_lengths[i];
    }
    char buffer[total_length];
    int head = 0;
    buffer[head++] = 0xF2;
    buffer[head++] = ((total_length - 5) >> 3) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 2) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 1) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 0) & 0xFF;

    for(int i = 0; i < manifest_length; i++){
        int name_len = strlen(manifest_names[i]);
        char return_type = string_to_type(manifest_returns[i]);
        int arg_count = manifest_item_lengths[i];
        buffer[head++] = (i >> 1) & 0xFF;
        buffer[head++] = (i >> 0) & 0xFF;
        buffer[head++] = (name_len >> 1) & 0xFF;
        buffer[head++] = (name_len >> 0) & 0xFF;
        for(int j = 0; j < name_len; j++){
            buffer[head++] = manifest_names[i][j];
        }
        buffer[head++] = return_type;
        buffer[head++] = (arg_count >> 1) & 0xFF;
        buffer[head++] = (arg_count >> 0) & 0xFF;
        for(int j = 0; j < arg_count; j++){
            buffer[head++] = string_to_type(manifest_items[i][j]);
        }
    }
    send(socket_id, buffer, total_length, 0);
}

void server_init(char *socket_location){
	int sock = 0;
	int data_len = 0;
	struct sockaddr_un remote;

	if( (sock = socket(AF_UNIX, SOCK_STREAM, 0)) == -1  )
	{
		printf("Client: Error on socket() call \n");
		return;
	}

	remote.sun_family = AF_UNIX;
	strcpy(remote.sun_path, socket_location);
	data_len = strlen(remote.sun_path) + sizeof(remote.sun_family);

	printf("Client: Trying to connect... \n");
	if(connect(sock, (struct sockaddr*)&remote, data_len) == -1)
	{
		printf("Client: Error on connect call \n");
		return;
	}
	printf("Successfully connected!\n");
  send_manifest(sock);
}