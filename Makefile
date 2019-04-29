build:
	@go test src/*.go;
	@echo "\033[1;33mGenerating bin...\033[0m"
	@go build src/*.go;
	@echo "\033[1;32mDone\033[0m"

install:
	@./scripts/install.sh;

test:
	go test src/*.go
