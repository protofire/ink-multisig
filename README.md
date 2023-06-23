# Ink Multisig

## Prerequisites

Before running the project, make sure you have the following prerequisites installed on your system:

- Rust Toolchain: You can install the Rust Toolchain by following the instructions [here](https://www.rust-lang.org/tools/install).
- cargo-contract: Install `cargo-contract` by visiting the [GitHub repository](https://github.com/paritytech/cargo-contract) and following the installation instructions.
- Node.js: Download Node.js from the official website [here](https://nodejs.org) and install it on your machine.

## Getting Started

To quickly get started with the project, follow these instructions:

1. Clone the repository:
```bash
   $ git clone https://github.com/protofire/ink-multisig.git
   $ cd ink-multisig
```

2. Run the make command to build the project and run the tests:
```bash
   $ make run
```
The make run command will automatically install the necessary dependencies, clean the project, build the contracts, download the substrate contracts node, and run the tests.

This command simplifies the setup process for the first time you run the project.

Note: Make sure you have all the prerequisites installed before running the command.

## Additional Commands
If you prefer to run the individual commands separately, here are the available options:
- **make clean:** Clean the project by removing the generated files.
- **make build:** Build the contracts and generate the artifacts.
- **make node-download:** Download the substrate contracts node.
- **make test:** Run the tests to verify the functionality of the smart contract.

Feel free to explore and use these commands based on your requirements.