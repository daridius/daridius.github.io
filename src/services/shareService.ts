import { compressAndEncode } from '../utils/compression';
import { generateKey, encryptData } from '../utils/encryption';
import { saveToKV } from './kvService';
import type { WrappedData } from '../data';

/**
 * High-level service to handle the entire "Share to KV" flow.
 */
export async function uploadWrappedData(data: WrappedData): Promise<{ kv: string; enc: string }> {
    console.log('📦 Preparando datos para compartir...');

    // 1. Compress
    const compressed = compressAndEncode(data);

    // 2. Generate Key
    const { key: cryptoKey, base64: encKeyB64 } = await generateKey();

    // 3. Encrypt
    const encrypted = await encryptData(compressed, cryptoKey);

    // 4. Upload to KV
    console.log('☁️ Subiendo a la nube (KV)...');
    const kvKey = await saveToKV(encrypted);

    const keys = { kv: kvKey, enc: encKeyB64 };

    // Save to sessionStorage for persistence in this session
    sessionStorage.setItem('shareKeys', JSON.stringify(keys));
    sessionStorage.removeItem('shareError');

    console.log('✅ Datos compartidos con éxito:', keys);
    return keys;
}
