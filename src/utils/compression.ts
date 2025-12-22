import LZString from 'lz-string';
import type { WrappedData } from '../data';

/**
 * EXTREME COMPRESSION STRATEGY:
 * 1. Dictionary-based string encoding (Shared list of names/words/emojis).
 * 2. Numeric date encoding (Days since Jan 1st).
 * 3. Flat numeric arrays where possible.
 * 4. Dense month array (fixed 12 values).
 */

class Dictionary {
    private entries: string[] = [];
    private map: Map<string, number> = new Map();

    add(val: string): number {
        if (this.map.has(val)) return this.map.get(val)!;
        const idx = this.entries.length;
        this.entries.push(val);
        this.map.set(val, idx);
        return idx;
    }

    get(idx: number): string {
        return this.entries[idx] || "";
    }

    export(): string[] {
        return this.entries;
    }

    constructor(initial?: string[]) {
        if (initial) {
            this.entries = initial;
            initial.forEach((v, i) => this.map.set(v, i));
        }
    }
}

/**
 * Converts "YYYY-MM-DD" to days since start of that year
 */
function dateToDayOfYear(dateStr: string): number {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function dayOfYearToDate(day: number, year: number): string {
    if (!day) return "";
    const date = new Date(year, 0);
    date.setDate(day);
    return date.toISOString().split('T')[0];
}

/**
 * Minimizes the WrappedData object into a dense array structure with Dictionary.
 */
function toArray(data: WrappedData): any[] {
    const dict = new Dictionary();

    // Helper for strings
    const s = (val: string) => dict.add(val);

    // Monthly data as dense array [Jan, Feb, ..., Dec]
    const months = new Array(12).fill(0);
    Object.entries(data.messages_per_month).forEach(([m, count]) => {
        const idx = parseInt(m) - 1;
        if (idx >= 0 && idx < 12) months[idx] = count;
    });

    const payload = [
        data.year, // 0
        s(data.group_name), // 1
        [ // 2: totals
            data.totals.messages,
            data.totals.words,
            data.totals.characters
        ],
        data.new_people.map(p => s(p)), // 3
        data.top_senders.map(sender => [s(sender.name), sender.messages]), // 4
        [ // 5: most_frequent
            s(data.most_frequent_message.author),
            s(data.most_frequent_message.content),
            data.most_frequent_message.count
        ],
        data.top_words.map(w => [s(w.word), w.count]), // 6
        data.top_emojis.map(e => [s(e.emoji), e.count]), // 7
        months, // 8: Dense month array
        [ // 9: peak_day
            dateToDayOfYear(data.peak_activity_day.date),
            data.peak_activity_day.messages
        ],
        [ // 10: silence
            dateToDayOfYear(data.longest_silence_streak.from),
            dateToDayOfYear(data.longest_silence_streak.to),
            data.longest_silence_streak.days
        ],
        [ // 11: activity
            dateToDayOfYear(data.longest_activity_streak.from),
            dateToDayOfYear(data.longest_activity_streak.to),
            data.longest_activity_streak.days
        ]
    ];

    return [dict.export(), payload];
}

/**
 * Restores the WrappedData object from the dense array structure.
 */
function fromArray(packed: any[]): WrappedData {
    const [dictArr, arr] = packed;
    const dict = new Dictionary(dictArr);
    const g = (idx: number) => dict.get(idx);
    const year = arr[0];

    // Monthly Map restoration from dense array
    const monthlyRecord: Record<number, number> = {};
    if (Array.isArray(arr[8])) {
        arr[8].forEach((count: number, i: number) => {
            if (count > 0) monthlyRecord[i + 1] = count;
        });
    }

    return {
        year,
        group_name: g(arr[1]),
        totals: {
            messages: arr[2][0],
            words: arr[2][1],
            characters: arr[2][2]
        },
        new_people: (arr[3] || []).map((idx: number) => g(idx)),
        top_senders: (arr[4] || []).map((s: any[]) => ({ name: g(s[0]), messages: s[1] })),
        most_frequent_message: {
            author: g(arr[5][0]),
            content: g(arr[5][1]),
            count: arr[5][2]
        },
        top_words: (arr[6] || []).map((w: any[]) => ({ word: g(w[0]), count: w[1] })),
        top_emojis: (arr[7] || []).map((e: any[]) => ({ emoji: g(e[0]), count: e[1] })),
        messages_per_month: monthlyRecord,
        peak_activity_day: {
            date: dayOfYearToDate(arr[9][0], year),
            messages: arr[9][1]
        },
        longest_silence_streak: {
            from: dayOfYearToDate(arr[10][0], year),
            to: dayOfYearToDate(arr[10][1], year),
            days: arr[10][2]
        },
        longest_activity_streak: {
            from: dayOfYearToDate(arr[11][0], year),
            to: dayOfYearToDate(arr[11][1], year),
            days: arr[11][2]
        }
    };
}

/**
 * BASE62 UTILITY
 * For ultra-clean URLs using only [0-9a-zA-Z]
 */
const B62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(bytes: Uint8Array): string {
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

function decodeBase62(str: string): Uint8Array {
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

export function compressAndEncode(data: WrappedData): string {
    const minimized = toArray(data);

    // Debug Logs requested by user
    console.log("--- COMPRESSION DEBUG ---");
    console.log("1. Dictionary:", minimized[0]);
    console.log("2. Numeric Payload:", JSON.stringify(minimized[1]));

    const json = JSON.stringify(minimized);
    const uint8 = LZString.compressToUint8Array(json);
    return encodeBase62(uint8);
}

export function decodeAndDecompress(hash: string): WrappedData | null {
    try {
        const uint8 = decodeBase62(hash);
        const json = LZString.decompressFromUint8Array(uint8);
        if (!json) return null;
        const packed = JSON.parse(json);
        return fromArray(packed);
    } catch (e) {
        console.error("Base62 Decompression failed", e);
        return null;
    }
}
