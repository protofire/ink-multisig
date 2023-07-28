import { hex_to_bytes } from "./convertions";

interface Argument {
  label: string;
  type: {
    displayName: string[];
    type: number;
  };
}

interface MessageInfo {
  selector: {
    hex: string;
    bytes: number[];
  };
  args: Argument[];
}

export class MessageIndex {
  private index: Map<string, MessageInfo> = new Map();

  constructor(abi: {
    spec: {
      messages: any[];
    };
  }) {
    for (const message of abi.spec.messages) {
      let args: Argument[] = [];
      let newMessageInfo: MessageInfo = {} as MessageInfo;

      newMessageInfo.selector = {
        hex: message.selector,
        bytes: hex_to_bytes(message.selector),
      };

      for (const arg of message.args) {
        args.push({
          label: arg!.label,
          type: {
            displayName: arg.type.displayName,
            type: arg.type.type,
          },
        });
      }

      newMessageInfo.args = args;
      this.index.set(message.label, newMessageInfo);
    }
  }

  getMessageInfo(label: string): MessageInfo | null {
    return this.index.get(label) || null;
  }

  transformArgsToBytes(api: any, label: string, args: unknown[]): number[] {
    const messageInfo = this.getMessageInfo(label);
  
    if (messageInfo === null) {
      throw new Error("Message not found");
    }
  
    if (args.length !== messageInfo.args.length) {
      throw new Error("Invalid number of arguments");
    }
  
    const numbers: number[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const argInfo = messageInfo.args[i];
  
      // TODO: Check if this works for all types, not only for primitives
      const convertedArg = api.createType(argInfo.type.displayName, arg).toU8a();
  
      // Append the convertedArg directly to the numbers array
      for (const byte of convertedArg) {
        numbers.push(byte);
      }
    }
  
    return numbers;
  }
}
