#!/bin/bash

# MacOS install
if [ ! -d /usr/local/go ];
then
  curl https://dl.google.com/go/go1.12.4.darwin-amd64.pkg -o go1.12.4.darwin-amd64.pkg;
  sudo installer -pkg go1.12.4.darwin-amd64.pkg -target /;
  echo "export GOROOT=/usr/local/go" >> ~/.bash_profile;
  echo "export GOPATH=$HOME/go" >> ~/.bash_profile;
  echo "export PATH=$GOPATH/bin:$GOROOT/bin:$PATH" >> ~/.bash_profile;
  echo "export PATH=$PATH:/usr/local/go/bin;" >> ~/.bash_profile;
  rm go1.12.4.darwin-amd64.pkg;
fi
