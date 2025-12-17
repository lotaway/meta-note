#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include "hello_c.h"

void test_hello()
{
    printf("Test mix c/c++\n");
}

int test_main(int argc, char **argv)
{
    int fd;
    if (argc != 2)
    {
        printf("Arguments number not enough %d\n", argc);
    }
    fd = open(argv[1], O_RDWR);
    if (fd < 0)
    {
        printf("Can't open file %s\n", argv[1]);
    }
}