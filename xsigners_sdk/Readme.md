# xSigners

## Using the ContractPromiseBuilder

The `ContractPromiseBuilder` provides a seamless way to create a `ContractPromise` for a specific chain. Here's how you can use it:

- Setup

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromiseBuilder } from 'xsigners-sdk';
```

- Initialize the Polkadot API

```typescript
const wsProvider = new WsProvider('wss://your-node-url');
const api = await ApiPromise.create({ provider: wsProvider });
```

- Create the ContractPromiseBuilder

```typescript
const contractBuilder = new ContractPromiseBuilder(api);
```

- Create a ContractPromise

With the builder ready, you can now create a `ContractPromise` for a specific chain:

```typescript
const chainId = 'shibuya-testnet'; // Replace with your desired chain ID
const contract = contractBuilder.createContract(chainId);
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

Ensure that the `chainId` you provide is supported. If it's not, the `ContractPromiseBuilder` will throw an error.
