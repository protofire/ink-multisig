/* This file is auto-generated */

import type { ContractPromise } from '@polkadot/api-contract';
import type { GasLimit, GasLimitAndRequiredValue } from '@727-ventures/typechain-types';
import { buildSubmittableExtrinsic } from '@727-ventures/typechain-types';
import type * as ArgumentTypes from '../types-arguments/multisig_factory';
import type BN from 'bn.js';
import type { ApiPromise } from '@polkadot/api';



export default class Methods {
	readonly __nativeContract : ContractPromise;
	readonly __apiPromise: ApiPromise;

	constructor(
		nativeContract : ContractPromise,
		apiPromise: ApiPromise,
	) {
		this.__nativeContract = nativeContract;
		this.__apiPromise = apiPromise;
	}
	/**
	 * newMultisig
	 *
	 * @param { (number | string | BN) } threshold,
	 * @param { Array<ArgumentTypes.AccountId> } ownersList,
	 * @param { Array<(number | string | BN)> } salt,
	*/
	"newMultisig" (
		threshold: (number | string | BN),
		ownersList: Array<ArgumentTypes.AccountId>,
		salt: Array<(number | string | BN)>,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "newMultisig", [threshold, ownersList, salt], __options);
	}

}