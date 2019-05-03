# laniakea

Install:

```bash
make install
```

Edit your `~/bashrc`:

```bash
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$GOPATH/bin:$GOROOT/bin:$PATH
```

```bash
source ~/.bashrc
```

Build:

```bash
make build
```
