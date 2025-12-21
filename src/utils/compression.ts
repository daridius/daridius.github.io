import LZString from 'lz-string';
import type { WrappedData } from '../data';

/**
 * Minimizes the WrappedData object into a dense array structure to remove JSON keys.
 * Order MUST differ strictly to the schema.
 */
function toArray(data: WrappedData): any[] {
    return [
        data.year, // 0
        data.group_name, // 1
        [ // 2: totals
            data.totals.messages,
            data.totals.words,
            data.totals.characters
        ],
        data.new_people, // 3: Array<string>
        data.top_senders.map(s => [s.name, s.messages]), // 4
        [ // 5: most_frequent
            data.most_frequent_message.author,
            data.most_frequent_message.content,
            data.most_frequent_message.count
        ],
        data.top_words.map(w => [w.word, w.count]), // 6
        data.top_emojis.map(e => [e.emoji, e.count]), // 7
        // 8: messages_per_month (Record<number, number> -> convert to array of 12 numbers or pairs?)
        // To safe space, let's just make it pairs or a dense array if indices are 1-12
        // Let's store as an object-like array: [[month, count], ...] to be safe if sparse
        Object.entries(data.messages_per_month).map(([k, v]) => [parseInt(k), v]),
        [ // 9: peak_day
            data.peak_activity_day.date,
            data.peak_activity_day.messages
        ],
        [ // 10: silence
            data.longest_silence_streak.from,
            data.longest_silence_streak.to,
            data.longest_silence_streak.days
        ],
        [ // 11: activity
            data.longest_activity_streak.from,
            data.longest_activity_streak.to,
            data.longest_activity_streak.days
        ]
    ];
}

/**
 * Restores the WrappedData object from the dense array structure.
 */
function fromArray(arr: any[]): WrappedData {
    if (!Array.isArray(arr) || arr.length < 12) {
        throw new Error("Invalid data format");
    }

    // Monthly Map restoration
    const monthlyRecord: Record<number, number> = {};
    if (Array.isArray(arr[8])) {
        arr[8].forEach((pair: any[]) => {
            monthlyRecord[pair[0]] = pair[1];
        });
    }

    return {
        year: arr[0],
        group_name: arr[1],
        totals: {
            messages: arr[2][0],
            words: arr[2][1],
            characters: arr[2][2]
        },
        new_people: arr[3],
        top_senders: (arr[4] || []).map((s: any[]) => ({ name: s[0], messages: s[1] })),
        most_frequent_message: {
            author: arr[5][0],
            content: arr[5][1],
            count: arr[5][2]
        },
        top_words: (arr[6] || []).map((w: any[]) => ({ word: w[0], count: w[1] })),
        top_emojis: (arr[7] || []).map((e: any[]) => ({ emoji: e[0], count: e[1] })),
        messages_per_month: monthlyRecord,
        peak_activity_day: {
            date: arr[9][0],
            messages: arr[9][1]
        },
        longest_silence_streak: {
            from: arr[10][0],
            to: arr[10][1],
            days: arr[10][2]
        },
        longest_activity_streak: {
            from: arr[11][0],
            to: arr[11][1],
            days: arr[11][2]
        }
    };
}

export function compressAndEncode(data: WrappedData): string {
    const minimized = toArray(data);
    const json = JSON.stringify(minimized);
    // Use compressToEncodedURIComponent for URL safety
    return LZString.compressToEncodedURIComponent(json);
}

export function decodeAndDecompress(hash: string): WrappedData | null {
    try {
        const json = LZString.decompressFromEncodedURIComponent(hash);
        if (!json) return null;
        const arrayData = JSON.parse(json);
        return fromArray(arrayData);
    } catch (e) {
        console.error("Decompression failed", e);
        return null;
    }
}
