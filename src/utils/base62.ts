/**
 * BASE62 UTILITY
 * For ultra-clean URLs using only [0-9a-zA-Z]
 */
const B62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function encodeBase62(bytes: Uint8Array): string {
    let value = BigInt(0);
    for (const b of bytes) {
        value = (value << BigInt(8)) + BigInt(b);
    }

    if (value === BigInt(0)) return "0";

    let res = "";
    while (value > 0) {
        res = B62_CHARS[Number(value % BigInt(62))] + res;
        value = value / BigInt(62);
    }
    return res;
}

export function decodeBase62(str: string): Uint8Array {
    let value = BigInt(0);
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const idx = B62_CHARS.indexOf(char);
        if (idx === -1) throw new Error("Invalid Base62 character");
        value = value * BigInt(62) + BigInt(idx);
    }

    const hex = value.toString(16);
    const hexFull = hex.length % 2 === 0 ? hex : "0" + hex;
    const len = hexFull.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = parseInt(hexFull.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
