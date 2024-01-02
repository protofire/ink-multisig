import { ApiPromise } from "@polkadot/api";
import { BlueprintPromise, ContractPromise } from "@polkadot/api-contract";
import { AbiMessage } from "@polkadot/api-contract/types";

export class ContractInterface {
  contract: BlueprintPromise | ContractPromise;

  constructor(api: ApiPromise, abi: any, address?: string) {
    if (address) {
      this.contract = new ContractPromise(api, abi, address);
    } else {
      this.contract = new BlueprintPromise(api, abi, abi.source.hash);
    }
  }

  getMessages(): AbiMessage[] {
    return this.contract.abi.messages;
  }

  getMessageInfo(methodName: string): AbiMessage | null {
    return this.contract.abi.findMessage(methodName);
  }

  transformArgsToBytes(methodName: string, args: unknown[]): number[] {
    const messageInfo = this.contract.abi.messages.find(
      (m) => m.method === methodName
    );

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

      const convertedArg = this.contract.api
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
