const KV_WORKER_URL = 'https://wasap.daridius.workers.dev';

export interface KVResponse {
    key: string;
    value?: string;
}

/**
 * Saves an encrypted value to the KV store.
 * Expects the server to generate an ID and return it.
 */
export async function saveToKV(encryptedValue: string): Promise<string> {
    const response = await fetch(`${KV_WORKER_URL}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: encryptedValue }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('KV Save Error Response:', errorText);
        throw new Error(`Failed to save to KV: ${response.status} ${response.statusText}`);
    }

    const data: KVResponse = await response.json();
    console.log('KV Save Success:', data);
    return data.key;
}

/**
 * Retrieves an encrypted value from the KV store by its key.
 */
export async function getFromKV(key: string): Promise<string> {
    const response = await fetch(`${KV_WORKER_URL}/items/${key}`);

    if (response.status === 404) {
        throw new Error('Link no válido o caducado.');
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch from KV: ${response.statusText}`);
    }

    const data: KVResponse = await response.json();
    if (!data.value) {
        throw new Error('El servidor no devolvió datos para esta clave.');
    }

    return data.value;
}
