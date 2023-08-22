import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import { ContractAbi } from '../../typed_contracts/multisig-factory/contract-info/multisig_factory';
import ContractMultisigFactory from '../../typed_contracts/multisig-factory/contracts/multisig_factory';
import {ALL_CHAINS, isValidChain, CHAIN_CONTRACTS_ADDRESS} from "../../constants"

export class MultisigFactorySdk {
  public static factory(chainId: ALL_CHAINS, signer: KeyringPair, nativeAPI: ApiPromise) {
    if (!isValidChain(chainId))
        throw new Error(`Unsupported chainId: ${chainId}`);

    const addressChain =  CHAIN_CONTRACTS_ADDRESS[chainId]
    
    return new ContractMultisigFactory(addressChain, signer, nativeAPI)
  }
  
  public static contractMetadata(chainId: ALL_CHAINS): { addressChain: string; ContractAbi: string; } {
    if (!isValidChain(chainId))
        throw new Error(`Unsupported chainId: ${chainId}`);
    
    const addressChain =  CHAIN_CONTRACTS_ADDRESS[chainId]
    
    return {addressChain, ContractAbi}
  }
}