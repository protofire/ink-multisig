import { createHash } from "crypto";

export function hex_to_bytes(hex: string): number[] {
  const buffer = Buffer.from(hex.slice(2), "hex");
  const numbers: number[] = Array.from(buffer);
  return numbers;
}

export function generateHash(input: string): number[] {
  const hash = createHash("sha256");
  hash.update(input);
  return hex_to_bytes(hash.digest("hex"));
}
