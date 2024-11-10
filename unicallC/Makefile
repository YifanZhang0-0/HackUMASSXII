c_test.i: test.c unicall_functions.h unicall.h
	g++ -E test.c -o c_test.i
../c_test: c_test.i
	g++ -o ../c_test test.c
run: test
	./../test
