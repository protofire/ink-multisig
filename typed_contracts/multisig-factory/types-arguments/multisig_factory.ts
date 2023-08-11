import type BN from 'bn.js';

export type Hash = string | number[]

export enum Error {
	instantiationFailed = 'InstantiationFailed'
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type AccountId = string | number[]

