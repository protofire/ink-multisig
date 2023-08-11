/* This file is auto-generated */

import type { ContractPromise } from '@polkadot/api-contract';
import type { GasLimit, GasLimitAndRequiredValue } from '@727-ventures/typechain-types';
import { buildSubmittableExtrinsic } from '@727-ventures/typechain-types';
import type * as ArgumentTypes from '../types-arguments/multisig';
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
	 * proposeTx
	 *
	 * @param { ArgumentTypes.Transaction } tx,
	*/
	"proposeTx" (
		tx: ArgumentTypes.Transaction,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "proposeTx", [tx], __options);
	}

	/**
	 * approveTx
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"approveTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "approveTx", [txId], __options);
	}

	/**
	 * rejectTx
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"rejectTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "rejectTx", [txId], __options);
	}

	/**
	 * tryExecuteTx
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"tryExecuteTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "tryExecuteTx", [txId], __options);
	}

	/**
	 * tryRemoveTx
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"tryRemoveTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "tryRemoveTx", [txId], __options);
	}

	/**
	 * addOwner
	 *
	 * @param { ArgumentTypes.AccountId } owner,
	*/
	"addOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "addOwner", [owner], __options);
	}

	/**
	 * removeOwner
	 *
	 * @param { ArgumentTypes.AccountId } owner,
	*/
	"removeOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "removeOwner", [owner], __options);
	}

	/**
	 * changeThreshold
	 *
	 * @param { (number | string | BN) } threshold,
	*/
	"changeThreshold" (
		threshold: (number | string | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "changeThreshold", [threshold], __options);
	}

	/**
	 * transfer
	 *
	 * @param { ArgumentTypes.AccountId } to,
	 * @param { (string | number | BN) } value,
	*/
	"transfer" (
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "transfer", [to, value], __options);
	}

	/**
	 * getOwners
	 *
	*/
	"getOwners" (
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getOwners", [], __options);
	}

	/**
	 * isOwner
	 *
	 * @param { ArgumentTypes.AccountId } owner,
	*/
	"isOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "isOwner", [owner], __options);
	}

	/**
	 * getThreshold
	 *
	*/
	"getThreshold" (
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getThreshold", [], __options);
	}

	/**
	 * getNextTxId
	 *
	*/
	"getNextTxId" (
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getNextTxId", [], __options);
	}

	/**
	 * getActiveTxidList
	 *
	*/
	"getActiveTxidList" (
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getActiveTxidList", [], __options);
	}

	/**
	 * getTx
	 *
	 * @param { (string | number | BN) } index,
	*/
	"getTx" (
		index: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getTx", [index], __options);
	}

	/**
	 * isTxValid
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"isTxValid" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "isTxValid", [txId], __options);
	}

	/**
	 * getTxApprovals
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"getTxApprovals" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getTxApprovals", [txId], __options);
	}

	/**
	 * getTxRejections
	 *
	 * @param { (string | number | BN) } txId,
	*/
	"getTxRejections" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getTxRejections", [txId], __options);
	}

	/**
	 * getTxApprovalForAccount
	 *
	 * @param { (string | number | BN) } txId,
	 * @param { ArgumentTypes.AccountId } owner,
	*/
	"getTxApprovalForAccount" (
		txId: (string | number | BN),
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getTxApprovalForAccount", [txId, owner], __options);
	}

}