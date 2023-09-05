import type * as EventTypes from '../event-types/multisig';
import type {ContractPromise} from "@polkadot/api-contract";
import type {ApiPromise} from "@polkadot/api";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/multisig.json';
import {getEventTypeDescription} from "../shared/utils";
import {handleEventReturn} from "@727-ventures/typechain-types";

export default class EventsClass {
	readonly __nativeContract : ContractPromise;
	readonly __api : ApiPromise;

	constructor(
		nativeContract : ContractPromise,
		api : ApiPromise,
	) {
		this.__nativeContract = nativeContract;
		this.__api = api;
	}

	public subscribeOnThresholdChangedEvent(callback : (event : EventTypes.ThresholdChanged) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('ThresholdChanged', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.ThresholdChanged);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'ThresholdChanged');
	}

	public subscribeOnOwnerAddedEvent(callback : (event : EventTypes.OwnerAdded) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('OwnerAdded', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.OwnerAdded);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'OwnerAdded');
	}

	public subscribeOnOwnerRemovedEvent(callback : (event : EventTypes.OwnerRemoved) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('OwnerRemoved', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.OwnerRemoved);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'OwnerRemoved');
	}

	public subscribeOnTransactionProposedEvent(callback : (event : EventTypes.TransactionProposed) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('TransactionProposed', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.TransactionProposed);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'TransactionProposed');
	}

	public subscribeOnApproveEvent(callback : (event : EventTypes.Approve) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('Approve', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Approve);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'Approve');
	}

	public subscribeOnRejectEvent(callback : (event : EventTypes.Reject) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('Reject', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Reject);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'Reject');
	}

	public subscribeOnTransactionExecutedEvent(callback : (event : EventTypes.TransactionExecuted) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('TransactionExecuted', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.TransactionExecuted);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'TransactionExecuted');
	}

	public subscribeOnTransactionCancelledEvent(callback : (event : EventTypes.TransactionCancelled) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('TransactionCancelled', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.TransactionCancelled);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'TransactionCancelled');
	}

	public subscribeOnTransactionRemovedEvent(callback : (event : EventTypes.TransactionRemoved) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('TransactionRemoved', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.TransactionRemoved);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'TransactionRemoved');
	}

	public subscribeOnTransferEvent(callback : (event : EventTypes.Transfer) => void) {
		const callbackWrapper = (args: any[], event: any) => {
			const _event: Record < string, any > = {};

			for (let i = 0; i < args.length; i++) {
				_event[event.args[i]!.name] = args[i]!.toJSON();
			}

			callback(handleEventReturn(_event, getEventTypeDescription('Transfer', EVENT_DATA_TYPE_DESCRIPTIONS)) as EventTypes.Transfer);
		};

		return this.__subscribeOnEvent(callbackWrapper, (eventName : string) => eventName == 'Transfer');
	}


	private __subscribeOnEvent(
		callback : (args: any[], event: any) => void,
		filter : (eventName: string) => boolean = () => true
	) {
		// @ts-ignore
		return this.__api.query.system.events((events) => {
			events.forEach((record: any) => {
				const { event } = record;

				if (event.method == 'ContractEmitted') {
					const [address, data] = record.event.data;

					if (address.toString() === this.__nativeContract.address.toString()) {
						const {args, event} = this.__nativeContract.abi.decodeEvent(data);

						if (filter(event.identifier.toString()))
							callback(args, event);
					}
				}
			});
		});
	}

}