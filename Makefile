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

build-contract-release:   ## Build the contracts.
	cd contracts && docker run -v "$(CURDIR)/contracts/multisig:/contracts" ink-rust-env cargo contract build --release && cd .. && mkdir -p artifacts && cp contracts/multisig/target/ink/multisig.contract artifacts/multisig.contract && cp contracts/multisig/target/ink/multisig.json artifacts/multisig.json && npx @727-ventures/typechain-polkadot --input artifacts --output typed_contracts

build-contract-debug:   ## Build the contracts.
	cd contracts && docker run -v "$(CURDIR)/contracts/multisig:/contracts" ink-rust-env cargo contract build && cd .. && mkdir -p artifacts && cp contracts/multisig/target/ink/multisig.contract artifacts/multisig.contract && cp contracts/multisig/target/ink/multisig.json artifacts/multisig.json && npx @727-ventures/typechain-polkadot --input artifacts --output typed_contracts

node-download:    ## Download the substrate contracts node.
	bash ./utils/download-node.sh
	
run:              ## Install dependencies, clean, build, and run tests.
	yarn install
	make clean
	make build-docker-image
	make build-contract-release
	make node-download
	make test