export interface WrappedData {
    year: number;
    group_name: string;
    totals: {
        messages: number;
        words: number;
        characters: number;
    };
    new_people: string[];
    top_senders: {
        name: string;
        messages: number;
    }[];
    most_frequent_message: {
        author: string;
        content: string;
        count: number;
    };
    top_words: {
        word: string;
        count: number;
    }[];
    top_emojis: {
        emoji: string;
        count: number;
    }[];
    messages_per_month: Record<number, number>;
    peak_activity_day: {
        date: string;
        messages: number;
    };
    longest_silence_streak: {
        from: string;
        to: string;
        days: number;
    };
    longest_activity_streak: {
        from: string;
        to: string;
        days: number;
    };
}

export const wrappedData: WrappedData = {
    "year": 2025,
    "group_name": "Los Real 💯",

    "totals": {
        "messages": 18342,
        "words": 241905,
        "characters": 1348921
    },

    "new_people": [
        "Camila",
        "Sebastián",
        "Vale"
    ],

    "top_senders": [
        {
            "name": "Nacho",
            "messages": 3610
        },
        {
            "name": "Fran",
            "messages": 2541
        },
        {
            "name": "Pedro",
            "messages": 1987
        }
    ],

    "most_frequent_message": {
        "author": "Nacho",
        "count": 142,
        "content": "Jajajaja ctm"
    },

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
        { "emoji": "🔥", "count": 214 }
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
