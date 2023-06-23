import { hex_to_bytes } from "./convertions";

export class MessageIndex {
  private index: Map<string, number[]> = new Map();

  constructor(abi: { spec: { messages: { label: string; selector: string }[] } }) {
    for (const message of abi.spec.messages) {
      this.index.set(message.label, hex_to_bytes(message.selector));
    }
  }

  getSelectorByLabel(label: string): number[] | null {
    return this.index.get(label) || null;
  }
}