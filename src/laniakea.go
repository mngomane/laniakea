package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

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
	}

	for _, path := range paths {
		forceRemove(homeDir + path)
	}
}

func clearJava(homeDir string) {
	paths := [4]string{
		"/Library/Internet Plug-Ins/JavaAppletPlugin.plugin",
		"/Library/PreferencePanes/JavaControlPanel.prefPane",
		homeDir + "/Library/Application Support/Oracle/Java",
		"/Library/Java/JavaVirtualMachines/*.jdk",
	}

	for _, path := range paths {
		forceRemove(path)
	}
}

func forceRemove(folder string) {
	files, err := filepath.Glob(folder)
	if nil != err {
		panic(err)
	}

	fmt.Printf("Files removed: %v\n", files)
	for _, file := range files {
		if err := os.RemoveAll(file); nil != err {
			panic(err)
		}
	}
}

func installJava() {
	cmd := exec.Command(
		"curl",
		"http://laniakea.sbx.snv.io/jdk-8u201-macosx-x64.dmg",
		"-o",
		"jdk-8u201-macosx-x64.dmg",
	)
	_, err := cmd.Output()
	if nil != err {
		panic(err)
	}

	cmd = exec.Command("hdiutil", "attach", "jdk-8u201-macosx-x64.dmg")
	_, err = cmd.Output()
	if nil != err {
		panic(err)
	}

	cmd = exec.Command("installer", "-package", "/Volumes/JDK 8 Update 201/JDK 8 Update 201.pkg", "-target", "/")
	_, err = cmd.Output()
	if nil != err {
		panic(err)
	}

	cmd = exec.Command("hdiutil", "detach", "/Volumes/JDK 8 Update 201/")
	_, err = cmd.Output()
	if nil != err {
		panic(err)
	}

	forceRemove("jdk-8u201-macosx-x64.dmg");
}

func isRoot() bool {
	cmd := exec.Command("id", "-u")
	output, err := cmd.Output()
	if nil != err {
		panic(err)
	}

	user, err := strconv.Atoi(string(output[:len(output) - 1]))
	if err != nil {
		panic(err)
	}

	return 0 == user
}

func main() {
	args := os.Args[1:]
	homeDir, err := os.UserHomeDir()
	if nil != err {
		println(err.Error())

		return;
	}

	if 0 < len(args) {
		switch args[0] {
			case "clear":
				if 1 < len(args) {
					switch true {
						case 0 == strings.Compare(args[1], "android-studio"):
							clearAndroidStudio(homeDir)
						case 0 == strings.Compare(args[1], "java"):
							if !isRoot() {
								fmt.Printf("This option requires root privileges. Use \"sudo\".\n")

								break
							}

							clearJava(homeDir)
					}
				}
			case "install":
				if 1 < len(args) {
					switch true {
						case 0 == strings.Compare(args[1], "java"):
							if !isRoot() {
								fmt.Printf("This option requires root privileges. Use \"sudo\".\n")

								break
							}

							installJava()
					}
				}
		}

		return;
	}
}
