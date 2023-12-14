import { ApiPromise } from "@polkadot/api";
import {
  BlueprintPromise,
} from '@polkadot/api-contract';
import { AbiMessage } from "@polkadot/api-contract/types";

export class ContractInterface {
  blueprint: BlueprintPromise;

  constructor(api: ApiPromise, abi: any) {
    this.blueprint = new BlueprintPromise(api, abi, abi.source.hash);
  }
  
  // TODO: Check if the codeHash is returned correctly
  getCodeHash(): string {
    return this.blueprint.codeHash.toString();
  }

  getMessageInfo(methodName: string): AbiMessage | null {
    return this.blueprint.abi.messages.find((m) => m.method === methodName) || null;
  }

  transformArgsToBytes(methodName: string, args: unknown[]): number[] {
    const messageInfo = this.blueprint.abi.messages.find((m) => m.method === methodName);

    if (!messageInfo) {
      throw new Error("Message not found");
    }

    if (args.length !== messageInfo.args.length) {
      throw new Error("Invalid number of arguments");
    }

    const numbers: number[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const argInfo = messageInfo.args[i];

      const convertedArg = this.blueprint.api
        .createType(argInfo.type.type, arg)
        .toU8a();
      // Log the index and the convertedArg
      //console.log("arg", i, convertedArg);

      // Append the convertedArg directly to the numbers array
      for (const byte of convertedArg) {
        numbers.push(byte);
      }
    }

    return numbers;
  }
}
