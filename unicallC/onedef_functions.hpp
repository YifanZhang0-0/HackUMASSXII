#include <memory>
#include <stddef.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <vector>

const char* manifest_names[512];
const char* manifest_returns[512];
const char** manifest_items[512];
size_t manifest_item_lengths[512];
struct fancy_return_type (*manifest_callbacks[512])(std::vector<char*>);
size_t manifest_length = 0;

char string_to_type(const char* name){
  if(strcmp(name, "long") == 0) return 0xA1;
  if(strcmp(name, "double") == 0) return 0xA2;
  if(strcmp(name, "char*") == 0) return 0xA3;
  else printf("Error: %s is not a registered type.", name);
  return -1;
}

struct fancy_return_type{
  void* data;
  const char* type;
  //TODO
};

struct fancy_return_type encode_return_data(void *data, const char *type_label){
  struct fancy_return_type my_output;
  my_output.data = data;
  my_output.type = type_label;
  return my_output;
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
    buffer[head++] = ((total_length - 5) >> 24) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 16) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 8) & 0xFF;
    buffer[head++] = ((total_length - 5) >> 0) & 0xFF;

    for(int i = 0; i < manifest_length; i++){
        int name_len = strlen(manifest_names[i]);
        char return_type = string_to_type(manifest_returns[i]);
        int arg_count = manifest_item_lengths[i];
        buffer[head++] = (i >> 8) & 0xFF;
        buffer[head++] = (i >> 0) & 0xFF;
        buffer[head++] = (name_len >> 8) & 0xFF;
        buffer[head++] = (name_len >> 0) & 0xFF;
        for(int j = 0; j < name_len; j++){
            buffer[head++] = manifest_names[i][j];
        }
        buffer[head++] = return_type;
        buffer[head++] = (arg_count >> 8) & 0xFF;
        buffer[head++] = (arg_count >> 0) & 0xFF;
        for(int j = 0; j < arg_count; j++){
            buffer[head++] = string_to_type(manifest_items[i][j]);
        }
    }
    send(socket_id, buffer, total_length, 0);
}

void handle_request(int socket){
  unsigned char header[5];
  int result = recv(socket, header, 5, 0);
  if(result > 0){
    printf("magic: %02x\n", header[0]);
  }
  unsigned length =
  ((int)header[1] << 24)|
  ((int)header[2] << 16)|
  ((int)header[3] << 8)|
  ((int)header[4]);

  printf("len: %d\n", length);

  unsigned char buffer[length];
  printf("%s\n", "HI");

  // if(header[0] != 0xf1) return;
  recv(socket, buffer, length, 0);
  printf("buffer: %02x%02x%02x%02x%02x%02x%02x%02x",
  buffer[0],
  buffer[1],
  buffer[2],
  buffer[3],
  buffer[4],
  buffer[5],
  buffer[6],
  buffer[7]
  );
  int function_id = 
  ((int)buffer[0] << 8)|
  ((int)buffer[1]);

  int return_id = 
  ((int)buffer[2] << 8)|
  ((int)buffer[3]);

  std::vector<char*> arguments;
  unsigned char* head = buffer + 4;

  printf("initial head: %02x", head[0]);
  while((head - buffer) < length){
    // printf("diff: %d", head - buffer);
    printf("diff %d", head-buffer);
    fflush(stdout);
    fflush(stderr);
    unsigned long value;
    switch(head[0]){
      case 0xA1:{
        printf("%s\n", "Read an integer.");
        value = 
          (((unsigned long)buffer[5]) << 56)+
          (((unsigned long)buffer[6]) << 48)+
          (((unsigned long)buffer[7]) << 40)+
          (((unsigned long)buffer[8]) << 32)+
          (((unsigned long)buffer[9]) << 24)+
          (((unsigned long)buffer[10]) << 16)+
          (((unsigned long)buffer[11]) << 8)+
          (((unsigned long)buffer[12]));
        printf("asvaawefvawevqw %d", value);
        arguments.push_back((char *)new unsigned long(value));
        head += 9;
      }break;
      case 0xA2:{
        printf("%s\n", "Read a float.");
        unsigned long data = 
          ((unsigned long)buffer[5] << 56)|
          ((unsigned long)buffer[6] << 48)|
          ((unsigned long)buffer[7] << 40)|
          ((unsigned long)buffer[8] << 32)|
          ((unsigned long)buffer[9] << 24)|
          ((unsigned long)buffer[12] << 16)|
          ((unsigned long)buffer[13] << 8)|
          ((unsigned long)buffer[14]);
        double *float_value = (double *)&data;
        arguments.push_back((char *)new double(*float_value));
        head += 9;
      }break;
      case 0xA3:{
        printf("%s\n", "Read a string.");
        unsigned length =
        ((int)header[1] << 24)|
        ((int)header[2] << 16)|
        ((int)header[3] << 8)|
        ((int)header[4]);
        char *my_string = new char[length + 1];
        memcpy(my_string, header + 5, length);
        arguments.push_back(my_string);
      }break;
      case 0xA4:{
      // printf("%s\n", "BAD");
      }break;
      case 0xA5:{
      // printf("%s\n", "BAD");
      }break;
      case 0xA6:{
      // printf("%s\n", "BAD");
      }break;
      default:{
      // printf("%s\n", "BAD");
      }
    }
  }
  fflush(stdout);
  fflush(stderr);
  printf("function id: %d", function_id);
  fflush(stdout);
  fflush(stderr);
  struct fancy_return_type return_struct = (*manifest_callbacks[function_id])(arguments);

  if(strcmp(return_struct.type, "long") == 0){
    unsigned char buffer[16];
    buffer[0] = 0xB0;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x0A;
    long value = *(long *)return_struct.data;
    buffer[5] = (return_id >> 8) & 0xff;
    buffer[6] = (return_id >> 0) & 0xff;
    buffer[7] = 0xA1;
    buffer[8] = (value >> 56) & 0xff;
    buffer[9] = (value >> 48) & 0xff;
    buffer[10] = (value >> 40) & 0xff;
    buffer[11] = (value >> 32) & 0xff;
    buffer[12] = (value >> 24) & 0xff;
    buffer[13] = (value >> 16) & 0xff;
    buffer[14] = (value >> 8) & 0xff;
    buffer[15] = (value >> 0) & 0xff;
    send(socket, buffer, 16, 0);
  }
  if(strcmp(return_struct.type, "double") == 0){
    unsigned char buffer[16];
    buffer[0] = 0xB0;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    buffer[4] = 0x0A;
    long value = *(long *)return_struct.data;
    printf("HIHHIHIHIHIHI %f", *((double *)(return_struct.data)));
    buffer[5] = (return_id >> 8) & 0xff;
    buffer[6] = (return_id >> 0) & 0xff;
    buffer[7] = 0xA2;
    buffer[8] = (value >> 56) & 0xff;
    buffer[9] = (value >> 48) & 0xff;
    buffer[10] = (value >> 40) & 0xff;
    buffer[11] = (value >> 32) & 0xff;
    buffer[12] = (value >> 24) & 0xff;
    buffer[13] = (value >> 16) & 0xff;
    buffer[14] = (value >> 8) & 0xff;
    buffer[15] = (value >> 0) & 0xff;
    send(socket, buffer, 16, 0);
  }
  fflush(stdout);
  fflush(stderr);
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
	printf("Sent Manifest!\n");
  while(1){
    handle_request(sock);
  }
}