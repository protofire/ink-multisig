# xSigners SDK classes

This classes provides an interface to interact with the Xsigners ink contract on the substrate ecosystem.

## Installation

- with `npm`:

```bash
npm i xsigners-sdk
```

- with `yarn`:

```bash
yarn add xsigners-sdk
```

## Usage

### 1. Setup

- Importing the class

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { MultisigFactory } from "xsigners-sdk/dist/xsigners_sdk/src";
```

- Initialize the Polkadot API

```typescript
const wsProvider = new WsProvider('wss://your-node-url');
const api = await ApiPromise.create({ provider: wsProvider });
```

- Create the instance

```typescript
const multisigFactory = new MultisigFactory(api, 'chainId');
```

### 2. Interact with the contract

- Get a contract ContractPromise

With the builder ready, you can now create a `ContractPromise` for a specific chain:

```typescript
const chainId = 'shibuya-testnet'; // Replace with your desired chain ID
const contract = multisigFactory.buildContractPromise(chainId); // If not supplied, the instance will be used.
```

- Interact with the Contract

```typescript
const result = await contract.query.methodName(accountAddress, /* method parameters */);
console.log(result.output?.toHuman());
```

```typescript
const tx = contract.tx.methodName({ value, gasLimit }, /* method parameters */);
const result = await tx.signAndSend(accountAddress);
```

### Note

Ensure that the `chainId` you provide is supported. If it's not, the `MultisigFactory` will throw an error.
