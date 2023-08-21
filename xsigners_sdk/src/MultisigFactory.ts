import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { ContractAbi } from '@typed_contracts/multisig-factory/contract-info/multisig_factory';
import {ALL_CHAINS, isValidChain, CHAIN_CONTRACTS_ADDRESS} from "./constants"

export class MultisigFactory {
  private nativeAPI: ApiPromise;
  private chainId: ALL_CHAINS;

  constructor(nativeAPI: ApiPromise, chainId: ALL_CHAINS) {
    this.nativeAPI = nativeAPI;
    this.chainId = chainId;
  }

  buildContractPromise(chainId?: ALL_CHAINS): ContractPromise {
    const _chainId = chainId || this.chainId

    if (!isValidChain(_chainId))
        throw new Error(`Unsupported chainId: ${chainId}`);
      
    const addressChain =  CHAIN_CONTRACTS_ADDRESS[_chainId]
    return new ContractPromise(this.nativeAPI, ContractAbi, addressChain);
  }
}