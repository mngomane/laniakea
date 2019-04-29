package main

import (
	"os"
	"io/ioutil"
	"testing"
)

func TestForceRemove(test *testing.T) {
	file, err := ioutil.TempFile("/tmp", "laniakea_test")
	if nil != err {
		panic(err)
	}

	fileName := file.Name()
	forceRemove(fileName)

	if _, err := os.Stat(fileName); nil == err {
		test.Errorf("\033[1;31mThe file was not removed !\033[0m")
	} else if os.IsNotExist(err) {
		// the file does not exists
	} else {
		test.Errorf("\033[1;31mSchrödinger file !\033[0m")
	}
}
