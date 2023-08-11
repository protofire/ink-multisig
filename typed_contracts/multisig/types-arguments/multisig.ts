import type BN from 'bn.js';

export type AccountId = string | number[]

export interface Error {
	envExecutionFailed ? : string,
	langExecutionFailed ? : LangError,
	ownersCantBeEmpty ? : null,
	thresholdGreaterThanOwners ? : null,
	thresholdCantBeZero ? : null,
	unauthorized ? : null,
	maxOwnersReached ? : null,
	ownerAlreadyExists ? : null,
	notOwner ? : null,
	maxTransactionsReached ? : null,
	txIdOverflow ? : null,
	alreadyVoted ? : null,
	invalidTxId ? : null,
	transferFailed ? : null
}

export class ErrorBuilder {
	static EnvExecutionFailed(value: string): Error {
		return {
			envExecutionFailed: value,
		};
	}
	static LangExecutionFailed(value: LangError): Error {
		return {
			langExecutionFailed: value,
		};
	}
	static OwnersCantBeEmpty(): Error {
		return {
			ownersCantBeEmpty: null,
		};
	}
	static ThresholdGreaterThanOwners(): Error {
		return {
			thresholdGreaterThanOwners: null,
		};
	}
	static ThresholdCantBeZero(): Error {
		return {
			thresholdCantBeZero: null,
		};
	}
	static Unauthorized(): Error {
		return {
			unauthorized: null,
		};
	}
	static MaxOwnersReached(): Error {
		return {
			maxOwnersReached: null,
		};
	}
	static OwnerAlreadyExists(): Error {
		return {
			ownerAlreadyExists: null,
		};
	}
	static NotOwner(): Error {
		return {
			notOwner: null,
		};
	}
	static MaxTransactionsReached(): Error {
		return {
			maxTransactionsReached: null,
		};
	}
	static TxIdOverflow(): Error {
		return {
			txIdOverflow: null,
		};
	}
	static AlreadyVoted(): Error {
		return {
			alreadyVoted: null,
		};
	}
	static InvalidTxId(): Error {
		return {
			invalidTxId: null,
		};
	}
	static TransferFailed(): Error {
		return {
			transferFailed: null,
		};
	}
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type Transaction = {
	address: AccountId,
	selector: Array<(number | string | BN)>,
	input: Array<(number | string | BN)>,
	transferredValue: (string | number | BN),
	gasLimit: (number | string | BN),
	allowReentry: boolean
}

export interface TxResult {
	success ? : Array<(number | string | BN)>,
	failed ? : Error
}

export class TxResultBuilder {
	static Success(value: Array<(number | string | BN)>): TxResult {
		return {
			success: value,
		};
	}
	static Failed(value: Error): TxResult {
		return {
			failed: value,
		};
	}
}

