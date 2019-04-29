package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func forceRemove(folder string) {
	files, err := filepath.Glob(folder);
	if nil != err {
		panic(err);
	}

	fmt.Printf("Files removed: %v\n", files);
	for _, file := range files {
		if err := os.RemoveAll(file); nil != err {
			panic(err)
		}
	}
}

func clearAndroidStudio(homeDir string) {
	forceRemove("/Applications/Android Studio.app");

	paths := [11]string{
		"/Library/Preferences/AndroidStudio*",
		"/Library/Preferences/com.google.android.",
		"/Library/Preferences/com.android.*",
		"/Library/Application Support/AndroidStudio*",
		"/Library/Logs/AndroidStudio*",
		"/.AndroidStudio*",
		"/AndroidStudioProjects",
		"/.gradle",
		"/.android",
		"/Library/Android*",
		"/.emulator_console_auth_token",
	};

	for _, path := range paths {
		forceRemove(homeDir + path);
	}
}

func main() {
	args := os.Args[1:];
	homeDir, err := os.UserHomeDir();
	if nil != err {
		println(err.Error());

		return;
	}

	if 0 < len(args) && 0 == strings.Compare(args[0], "clear") {
		switch args[0] {
		case "clear":
			switch true {
			case 1 < len(args) && 0 == strings.Compare(args[1], "android-studio"):
				clearAndroidStudio(homeDir);
			}
		}

		return;
	}
}
