import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ContractAbi } from '@typed_contracts/multisig-factory/contract-info/multisig_factory';
import {ALL_CHAINS, isValidChain, CHAIN_CONTRACTS_ADDRESS} from "./constants"

export class ContractPromiseBuilder {
  private nativeAPI: ApiPromise;

  constructor(nativeAPI: ApiPromise) {
    this.nativeAPI = nativeAPI;
  }

  createContract(chainId: ALL_CHAINS): ContractPromise {
    if (!isValidChain(chainId))
        throw new Error(`Unsupported chainId: ${chainId}`);
      
    const addressChain =  CHAIN_CONTRACTS_ADDRESS[chainId]
    return new ContractPromise(this.nativeAPI, ContractAbi, addressChain);
  }
}