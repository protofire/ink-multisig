export function hex_to_bytes(hex: string): number[] {
    const buffer = Buffer.from(hex.slice(2), "hex");
    const numbers: number[] = Array.from(buffer);
    return numbers;
}