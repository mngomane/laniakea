package main

import (
	"io"
	"fmt"
	"net/http"
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

func downloadFile(url string, path string) error {
	// Get the data
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Create the file
	out, err := os.Create(path)
	if err != nil {
		return err
	}
	defer out.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	return err
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
	err := downloadFile("http://server.laniakea.sbx.snv.io/jdk-8u201-macosx-x64.dmg", "jdk-8u201-macosx-x64.dmg")
	// cmd := exec.Command("curl", "https://server.laniakea.sbx.snv.io/jdk-8u201-macosx-x64.dmg", "-o", "jdk-8u201-macosx-x64.dmg")
	// _, err := cmd.Output()
	if nil != err {
		panic(err)
	}
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
