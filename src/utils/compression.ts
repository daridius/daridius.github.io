import LZString from 'lz-string';
import type { WrappedData } from '../data';

/**
 * GENERIC COMPRESSION SYSTEM
 * 
 * Instead of custom field mapping (which is fragile), we use:
 * 1. JSON.stringify (Preserves ALL data: stats, names, stickers)
 * 2. LZString (Standard compression)
 * 3. Base62 (Clean URL encoding)
 */

export function compressAndEncode(data: WrappedData): Uint8Array {
    try {
        const json = JSON.stringify(data);
        // Regresar Uint8Array directo para procesar sin encoding pesado
        return LZString.compressToUint8Array(json);
    } catch (e) {
        console.error("Compression failed", e);
        throw new Error("No se pudo comprimir la data del Wrapped");
    }
}

export function decodeAndDecompress(uint8: Uint8Array): WrappedData | null {
    if (!uint8 || uint8.length === 0) return null;

    try {
        const json = LZString.decompressFromUint8Array(uint8);
        if (!json) return null;

        const data = JSON.parse(json) as WrappedData;
        console.log("✅ Data generically decompressed:", data);
        return data;
    } catch (e) {
        console.error("Generic decompression failed", e);
        return null;
    }
}
