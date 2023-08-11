/* This file is auto-generated */

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { GasLimit, GasLimitAndRequiredValue, Result } from '@727-ventures/typechain-types';
import type { QueryReturnType } from '@727-ventures/typechain-types';
import { queryOkJSON, queryJSON, handleReturnType } from '@727-ventures/typechain-types';
import { txSignAndSend } from '@727-ventures/typechain-types';
import type * as ArgumentTypes from '../types-arguments/multisig';
import type * as ReturnTypes from '../types-returns/multisig';
import type BN from 'bn.js';
//@ts-ignore
import {ReturnNumber} from '@727-ventures/typechain-types';
import {getTypeDescription} from './../shared/utils';
// @ts-ignore
import type {EventRecord} from "@polkadot/api/submittable";
import {decodeEvents} from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/multisig.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/multisig.json';


export default class Methods {
	readonly __nativeContract : ContractPromise;
	readonly __keyringPair : KeyringPair;
	readonly __callerAddress : string;
	readonly __apiPromise: ApiPromise;

	constructor(
		apiPromise : ApiPromise,
		nativeContract : ContractPromise,
		keyringPair : KeyringPair,
	) {
		this.__apiPromise = apiPromise;
		this.__nativeContract = nativeContract;
		this.__keyringPair = keyringPair;
		this.__callerAddress = keyringPair.address;
	}

	/**
	* proposeTx
	*
	* @param { ArgumentTypes.Transaction } tx,
	* @returns { void }
	*/
	"proposeTx" (
		tx: ArgumentTypes.Transaction,
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "proposeTx", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [tx], __options);
	}

	/**
	* approveTx
	*
	* @param { (string | number | BN) } txId,
	* @returns { void }
	*/
	"approveTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "approveTx", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [txId], __options);
	}

	/**
	* rejectTx
	*
	* @param { (string | number | BN) } txId,
	* @returns { void }
	*/
	"rejectTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "rejectTx", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [txId], __options);
	}

	/**
	* tryExecuteTx
	*
	* @param { (string | number | BN) } txId,
	* @returns { void }
	*/
	"tryExecuteTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "tryExecuteTx", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [txId], __options);
	}

	/**
	* tryRemoveTx
	*
	* @param { (string | number | BN) } txId,
	* @returns { void }
	*/
	"tryRemoveTx" (
		txId: (string | number | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "tryRemoveTx", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [txId], __options);
	}

	/**
	* addOwner
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @returns { void }
	*/
	"addOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "addOwner", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [owner], __options);
	}

	/**
	* removeOwner
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @returns { void }
	*/
	"removeOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "removeOwner", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [owner], __options);
	}

	/**
	* changeThreshold
	*
	* @param { (number | string | BN) } threshold,
	* @returns { void }
	*/
	"changeThreshold" (
		threshold: (number | string | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "changeThreshold", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [threshold], __options);
	}

	/**
	* transfer
	*
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } value,
	* @returns { void }
	*/
	"transfer" (
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		__options: GasLimit,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "transfer", (events: EventRecord) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [to, value], __options);
	}

	/**
	* getOwners
	*
	* @returns { Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError> }
	*/
	"getOwners" (
		__options: GasLimit,
	): Promise< QueryReturnType< Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getOwners", [], __options, (result) => { return handleReturnType(result, getTypeDescription(17, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* isOwner
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @returns { Result<boolean, ReturnTypes.LangError> }
	*/
	"isOwner" (
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	): Promise< QueryReturnType< Result<boolean, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "isOwner", [owner], __options, (result) => { return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getThreshold
	*
	* @returns { Result<number, ReturnTypes.LangError> }
	*/
	"getThreshold" (
		__options: GasLimit,
	): Promise< QueryReturnType< Result<number, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getThreshold", [], __options, (result) => { return handleReturnType(result, getTypeDescription(19, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getNextTxId
	*
	* @returns { Result<ReturnNumber, ReturnTypes.LangError> }
	*/
	"getNextTxId" (
		__options: GasLimit,
	): Promise< QueryReturnType< Result<ReturnNumber, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getNextTxId", [], __options, (result) => { return handleReturnType(result, getTypeDescription(20, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getActiveTxidList
	*
	* @returns { Result<Array<ReturnNumber>, ReturnTypes.LangError> }
	*/
	"getActiveTxidList" (
		__options: GasLimit,
	): Promise< QueryReturnType< Result<Array<ReturnNumber>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getActiveTxidList", [], __options, (result) => { return handleReturnType(result, getTypeDescription(21, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getTx
	*
	* @param { (string | number | BN) } index,
	* @returns { Result<ReturnTypes.Transaction | null, ReturnTypes.LangError> }
	*/
	"getTx" (
		index: (string | number | BN),
		__options: GasLimit,
	): Promise< QueryReturnType< Result<ReturnTypes.Transaction | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getTx", [index], __options, (result) => { return handleReturnType(result, getTypeDescription(22, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* isTxValid
	*
	* @param { (string | number | BN) } txId,
	* @returns { Result<Result<null, ReturnTypes.Error>, ReturnTypes.LangError> }
	*/
	"isTxValid" (
		txId: (string | number | BN),
		__options: GasLimit,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.Error>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "isTxValid", [txId], __options, (result) => { return handleReturnType(result, getTypeDescription(10, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getTxApprovals
	*
	* @param { (string | number | BN) } txId,
	* @returns { Result<number | null, ReturnTypes.LangError> }
	*/
	"getTxApprovals" (
		txId: (string | number | BN),
		__options: GasLimit,
	): Promise< QueryReturnType< Result<number | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getTxApprovals", [txId], __options, (result) => { return handleReturnType(result, getTypeDescription(24, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getTxRejections
	*
	* @param { (string | number | BN) } txId,
	* @returns { Result<number | null, ReturnTypes.LangError> }
	*/
	"getTxRejections" (
		txId: (string | number | BN),
		__options: GasLimit,
	): Promise< QueryReturnType< Result<number | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getTxRejections", [txId], __options, (result) => { return handleReturnType(result, getTypeDescription(24, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getTxApprovalForAccount
	*
	* @param { (string | number | BN) } txId,
	* @param { ArgumentTypes.AccountId } owner,
	* @returns { Result<boolean | null, ReturnTypes.LangError> }
	*/
	"getTxApprovalForAccount" (
		txId: (string | number | BN),
		owner: ArgumentTypes.AccountId,
		__options: GasLimit,
	): Promise< QueryReturnType< Result<boolean | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getTxApprovalForAccount", [txId, owner], __options, (result) => { return handleReturnType(result, getTypeDescription(26, DATA_TYPE_DESCRIPTIONS)); });
	}

}