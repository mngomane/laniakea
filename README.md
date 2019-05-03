# laniakea

Install:

```bash
make install
```

Edit your `~/.bash_profile`:

```bash
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
```

```bash
source ~/.bash_profile 
```

Build:

```bash
make build
```
