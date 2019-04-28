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
	forceRemove(homeDir + "/Library/Preferences/AndroidStudio*");
	forceRemove(homeDir + "/Library/Preferences/com.google.android.");
	forceRemove(homeDir + "/Library/Preferences/com.android.*");
	forceRemove(homeDir + "/Library/Application Support/AndroidStudio*");
	forceRemove(homeDir + "/Library/Logs/AndroidStudio*");
	forceRemove(homeDir + "/Library/Caches/AndroidStudio*");
	forceRemove(homeDir + "/.AndroidStudio*");
	forceRemove(homeDir + "/AndroidStudioProjects");
	forceRemove(homeDir + "/.gradle");
	forceRemove(homeDir + "/.android");
	forceRemove(homeDir + "/Library/Android*");
	forceRemove(homeDir + "/.emulator_console_auth_token");
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
