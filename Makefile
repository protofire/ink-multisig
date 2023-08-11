.PHONY: help test clean build node-download run

help:             ## Show the help.
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@fgrep "##" Makefile | fgrep -v fgrep

test:             ## Run the tests.
	@echo "Running Tests:"
	./contracts_node/substrate-contracts-node -l error > /dev/null & echo $$! > node_pid.tmp
	@trap 'kill $$(cat node_pid.tmp) && rm node_pid.tmp' EXIT; \
	yarn run mocha --config .mocharc.json

clean:            ## Clean the project.
	rm -rf ./typed_contracts/* && rm -rf ./artifacts/*

build-docker-image:
	docker build -t ink-rust-env .

build-contract-release:   ## Build the contracts in release mode.
	bash ./utils/build-core-contracts.sh --release

build-contract-debug:   ## Build the contracts in debug mode.
	bash ./utils/build-core-contracts.sh
	
type-generation:   ## Generate the types for the contracts.
	bash ./utils/types-gen.sh

node-download:    ## Download the substrate contracts node.
	bash ./utils/download-node.sh

compile-contracts:          ## Compile the contracts.
	make build-docker-image
	make build-contract-release
	
run-tests:              ## Install dependencies, download node and run tests.
	yarn install
	make node-download
	make test

build-and-test:
	make build-contract-release
	make type-generation
	make test