import type {ReturnNumber} from "@727-ventures/typechain-types";
import type * as ReturnTypes from '../types-returns/multisig_factory';

export interface NewMultisig {
	multisigAddress: ReturnTypes.AccountId;
	threshold: number;
	ownersList: Array<ReturnTypes.AccountId>;
	salt: Array<number>;
}

