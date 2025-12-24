export interface WrappedData {
    year: number;
    group_name: string;
    participants: string[];
    totals?: {
        messages: number;
        words: number;
        characters: number;
    };
    new_people?: number[];
    top_senders?: {
        nameIndex: number;
        messages: number;
    }[];
    top_deleters?: {
        nameIndex: number;
        deleted: number;
    }[];
    top_editors?: {
        nameIndex: number;
        edited: number;
    }[];
    most_frequent_message?: {
        authorIndex: number;
        content: string;
        count: number;
    }[];
    top_words?: {
        word: string;
        count: number;
    }[];
    top_emojis?: {
        emoji: string;
        count: number;
    }[];
    messages_per_month?: Record<number, number>;
    peak_activity_day?: {
        date: string;
        messages: number;
    };
    longest_silence_streak?: {
        from: string;
        to: string;
        days: number;
    };
    longest_activity_streak?: {
        from: string;
        to: string;
        days: number;
    };
    top_stickers?: {
        content: string;
        count: number;
    }[];
    top_sticker_senders?: {
        nameIndex: number;
        sticker: string;
        count: number;
    }[];
    most_sticker_sender?: {
        nameIndex: number;
        stickers: number;
    };
    most_audio_sender?: {
        nameIndex: number;
        audios: number;
    };
    most_location_sender?: {
        nameIndex: number;
        locations: number;
    };
    most_poll_starter?: {
        nameIndex: number;
        polls: number;
    };
    most_image_sender?: {
        nameIndex: number;
        images: number;
    };
    most_video_sender?: {
        nameIndex: number;
        videos: number;
    };
    most_document_sender?: {
        nameIndex: number;
        documents: number;
    };
}

export const wrappedData: WrappedData = {
    "year": 2025,
    "group_name": "Los Real 💯",
    "participants": [
        "Nacho",
        "Fran",
        "Pedro",
        "Seba",
        "Milla",
        "Camila",
        "Sebastián",
        "Vale"
    ],

    "totals": {
        "messages": 18342,
        "words": 241905,
        "characters": 1348921
    },

    "new_people": [5, 6, 7],

    "top_senders": [
        {
            "nameIndex": 0,
            "messages": 3610
        },
        {
            "nameIndex": 1,
            "messages": 2541
        },
        {
            "nameIndex": 2,
            "messages": 1987
        },
        {
            "nameIndex": 3,
            "messages": 1542
        },
        {
            "nameIndex": 4,
            "messages": 1201
        }
    ],

    "most_frequent_message": [
        {
            "authorIndex": 0,
            "count": 142,
            "content": "Jajajaja ctm"
        }
    ],

    "top_words": [
        { "word": "jajaja", "count": 412 },
        { "word": "weon", "count": 389 },
        { "word": "mañana", "count": 344 },
        { "word": "grupo", "count": 301 },
        { "word": "dale", "count": 287 }
    ],

    "top_emojis": [
        { "emoji": "❤️", "count": 512 },
        { "emoji": "😂", "count": 386 },
        { "emoji": "🔥", "count": 214 },
        { "emoji": "🤔", "count": 185 },
        { "emoji": "💀", "count": 142 }
    ],

    "messages_per_month": {
        1: 1320,
        2: 980,
        3: 1540,
        4: 1620,
        5: 1710,
        6: 1495,
        7: 1580,
        8: 1660,
        9: 1820,
        10: 2105,
        11: 1987,
        12: 2525
    },

    "peak_activity_day": {
        "date": "2025-10-18",
        "messages": 642
    },

    "longest_silence_streak": {
        "from": "2025-02-09",
        "to": "2025-02-14",
        "days": 6
    },

    "longest_activity_streak": {
        "from": "2025-09-03",
        "to": "2025-10-21",
        "days": 49
    }
};

export const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
