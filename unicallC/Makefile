c_test.i: test.cpp onedef_functions.hpp onedef_macros.hpp
	g++ -E test.cpp -o c_test.i
../c_test: c_test.i
	g++ -o ../c_test test.cpp
run: test
	./../test
