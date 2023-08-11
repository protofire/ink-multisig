import type {ReturnNumber} from "@727-ventures/typechain-types";
import type * as ReturnTypes from '../types-returns/multisig';

export interface ThresholdChanged {
	threshold: number;
}

export interface OwnerAdded {
	owner: ReturnTypes.AccountId;
}

export interface OwnerRemoved {
	owner: ReturnTypes.AccountId;
}

export interface TransactionProposed {
	txId: ReturnNumber;
	contractAddress: ReturnTypes.AccountId;
	selector: Array<number>;
	input: Array<number>;
	transferredValue: ReturnNumber;
	gasLimit: number;
	allowReentry: boolean;
}

export interface Approve {
	txId: ReturnNumber;
	owner: ReturnTypes.AccountId;
}

export interface Reject {
	txId: ReturnNumber;
	owner: ReturnTypes.AccountId;
}

export interface TransactionExecuted {
	txId: ReturnNumber;
	result: ReturnTypes.TxResult;
}

export interface TransactionCancelled {
	txId: ReturnNumber;
}

export interface TransactionRemoved {
	txId: ReturnNumber;
}

export interface Transfer {
	to: ReturnTypes.AccountId;
	value: ReturnNumber;
}

