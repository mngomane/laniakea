#!/bin/bash

# MacOS install
if [ ! -d /usr/local/go ];
then
  curl https://dl.google.com/go/go1.12.4.darwin-amd64.pkg -o go1.12.4.darwin-amd64.pkg;
  sudo installer -pkg go1.12.4.darwin-amd64.pkg -target /;
  export PATH=$PATH:/usr/local/go/bin;
  rm go1.12.4.darwin-amd64.pkg;
fi
