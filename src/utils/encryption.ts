/**
 * Encryption module using AES-GCM 128-bit.
 * Short keys (16 bytes) are used to keep URLs manageable.
 */

import { encodeBase62, decodeBase62 } from "./base62";

/**
 * Generates a crypto key and exports it as a base62 string.
 */
export async function generateKey(): Promise<{ key: CryptoKey; base64: string }> {
    const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 128 },
        true,
        ["encrypt", "decrypt"]
    );
    const exported = await crypto.subtle.exportKey("raw", key);
    // Use Base62 for ultra-clean links
    const base62 = encodeBase62(new Uint8Array(exported));
    return { key, base64: base62 };
}

/**
 * Imports a key from a base62 string.
 */
export async function importKey(base62: string): Promise<CryptoKey> {
    const bytes = decodeBase62(base62);
    return crypto.subtle.importKey(
        "raw",
        bytes.buffer as ArrayBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a Uint8Array using AES-GCM.
 * Returns a base64 string containing: [IV (12 bytes)] + [Encrypted Data]
 */
export async function encryptData(uint8Data: Uint8Array, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        uint8Data.buffer as ArrayBuffer
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // For the large encrypted payload (which goes to KV body, not URL)
    // standard Base64 is much faster and safer than BigInt-based Base62.
    let binary = "";
    for (let i = 0; i < combined.byteLength; i++) {
        binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
}

/**
 * Decrypts a base64 string (IV + data) using AES-GCM.
 */
export async function decryptData(combinedBase64: string, key: CryptoKey): Promise<Uint8Array> {
    const binary = atob(combinedBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    );

    return new Uint8Array(decrypted);
}
