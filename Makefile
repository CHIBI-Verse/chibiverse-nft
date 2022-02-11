include .env
export


default:
	echo 'nothing to do as default'
	
yarn-init:
	yarn add -D ganache-cli 
	yarn add -D typechain
	yarn add -D @typechain/web3-v1
	yarn add -D jest @types/jest
	yarn add -D @types/web3
	yarn add -D @types/node
	yarn add -D ts-node 
	yarn add -D ts-jest
	yarn add web3
	yarn add bn.js
yarn-install:
	yarn

test-js:
	yarn run jest --testTimeout=600000

ganache:
	ganache-cli --mnemonic "${SEED_GANACHE}"

gen-pass:
	date +%s | sha256sum | base64 | head -c 32 ; echo

go-get:
	go get
go-build:
	go build .
reader:
	go run cmd/reader/main.go
writer:
	go run cmd/writer/main.go
watcher:
	go run cmd/watcher/main.go
deployer:
	go run cmd/deployer/main.go

truffle-compile:
	yarn truffle compile
	yarn run typechain --target=web3-v1 'build/contracts/*.json'
	if [ ! -d abigenBindings ]; then mkdir abigenBindings ; fi
	yarn truffle run abigen
	if [ ! -d bindings ]; then mkdir bindings ; fi
	if [ ! -d bindings/chibiverse ]; then mkdir bindings/chibiverse ; fi
	abigen --abi=abigenBindings/abi/ChibiVerse.abi --bin=abigenBindings/bin/ChibiVerse.bin --pkg chibiverse --out bindings/chibiverse/bindings.go
	
migrate-dev:
	truffle migreate --network development

migrate-rinkeby:
	truffle migreate --network rinkeby

migrate-rinkeby-dry:
	truffle migreate --network rinkeby --dry-run

migrate-mainnet-dry:
	truffle migreate --network mainnet --dry-run