# Ink Multisig

## Prerequisites

Before running the project, make sure you have the following prerequisites installed on your system:

- Node.js: Download Node.js from the official website [here](https://nodejs.org) and install it on your machine.
- Docker: Download Docker from the official website [here](https://docs.docker.com/get-docker/) and install it on your machine.
- Yarn: Download Yarn from the official website [here](https://classic.yarnpkg.com/en/docs/install) and install it on your machine.

## Getting Started

To quickly get started with the project, follow these instructions:

1. Clone the repository:
```bash
   $ git clone https://github.com/protofire/ink-multisig.git
   $ cd ink-multisig
```

2. Run the make command to install the dependencies and run the tests:
```bash
   $ make run-tests
```

This command simplifies the setup process for the first time you run the project.
Note: Make sure you have all the prerequisites installed before running the command.

## Additional Commands
The contracts have already been compiled, and we provide the generated artifacts. If you prefer to compile them yourself, you can achieve this by executing the following command within our provided Docker compilation environment. By doing so, you will get identical artifacts to those we provided.

```bash
   $ make compile-contracts
```

After that, you can check the generated artifacts in the target folder of each contract.