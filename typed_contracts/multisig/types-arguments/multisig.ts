import type BN from 'bn.js';

export type AccountId = string | number[]

export interface MultisigError {
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

export class MultisigErrorBuilder {
	static EnvExecutionFailed(value: string): MultisigError {
		return {
			envExecutionFailed: value,
		};
	}
	static LangExecutionFailed(value: LangError): MultisigError {
		return {
			langExecutionFailed: value,
		};
	}
	static OwnersCantBeEmpty(): MultisigError {
		return {
			ownersCantBeEmpty: null,
		};
	}
	static ThresholdGreaterThanOwners(): MultisigError {
		return {
			thresholdGreaterThanOwners: null,
		};
	}
	static ThresholdCantBeZero(): MultisigError {
		return {
			thresholdCantBeZero: null,
		};
	}
	static Unauthorized(): MultisigError {
		return {
			unauthorized: null,
		};
	}
	static MaxOwnersReached(): MultisigError {
		return {
			maxOwnersReached: null,
		};
	}
	static OwnerAlreadyExists(): MultisigError {
		return {
			ownerAlreadyExists: null,
		};
	}
	static NotOwner(): MultisigError {
		return {
			notOwner: null,
		};
	}
	static MaxTransactionsReached(): MultisigError {
		return {
			maxTransactionsReached: null,
		};
	}
	static TxIdOverflow(): MultisigError {
		return {
			txIdOverflow: null,
		};
	}
	static AlreadyVoted(): MultisigError {
		return {
			alreadyVoted: null,
		};
	}
	static InvalidTxId(): MultisigError {
		return {
			invalidTxId: null,
		};
	}
	static TransferFailed(): MultisigError {
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
	failed ? : MultisigError
}

export class TxResultBuilder {
	static Success(value: Array<(number | string | BN)>): TxResult {
		return {
			success: value,
		};
	}
	static Failed(value: MultisigError): TxResult {
		return {
			failed: value,
		};
	}
}

