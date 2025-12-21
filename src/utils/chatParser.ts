import type { WrappedData } from '../data';

// Common stop words in Spanish to be filtered out from word analysis
const STOP_WORDS = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'un', 'por', 'con', 'no', 'una', 'su', 'para', 'es', 'al', 'lo', 'como',
    'más', 'pero', 'sus', 'le', 'ya', 'o', 'fue', 'este', 'ha', 'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre',
    'también', 'me', 'hasta', 'hay', 'donde', 'han', 'quien', 'están', 'estado', 'desde', 'todo', 'nos', 'durante', 'estados', 'todos', 'uno',
    'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras',
    'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas',
    'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos',
    'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro',
    'vuestra', 'vuestros', 'vuestras', 'esos', 'esas', 'estoy', 'estás', 'estamos', 'estáis', 'están', 'esté', 'estés', 'estemos', 'estéis',
    'estén', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 'estaré', 'estarás', 'estaremos', 'estaréis', 'estarán', 'estaba',
    'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera', 'estuvieras',
    'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese', 'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado',
    'estada', 'estados', 'estadas', 'estad', 'he', 'has', 'hemos', 'habéis', 'han', 'haya', 'hayas', 'hayamos', 'hayáis', 'hayan', 'habría',
    'habrías', 'habríamos', 'habríais', 'habrían', 'habré', 'habrás', 'habremos', 'habréis', 'habrán', 'había', 'habías', 'habíamos',
    'habíais', 'habían', 'hube', 'hubiste', 'hubimos', 'hubisteis', 'hubieron', 'hubiera', 'hubieras', 'hubiéramos', 'hubierais',
    'hubieran', 'hubiese', 'hubieses', 'hubiésemos', 'hubieseis', 'hubiesen', 'haciendo', 'hecho', 'hecha', 'hechos', 'hechas', 'haced',
    'media', 'omitted', 'multimedia', 'omitido', 'imagen', 'video', 'audio', 'sticker', 'gif', 'null', 'nan'
]);

interface Message {
    date: Date;
    author: string;
    content: string;
}

// Regex patterns to match various WhatsApp timestamp formats
// 1. [DD/MM/YYYY, HH:mm:ss] Author: Message (iOS)
// 2. DD/MM/YYYY HH:mm - Author: Message (Android common)
// 3. M/D/YY, H:mm AM/PM - Author: Message (US formats)
const TIMESTAMP_REGEXES = [
    /^\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\]?[\s\u200e]*-?[\s\u200e]*([^:]+): (.+)/, // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s+(\d{1,2}):(\d{2})\u202f(AM|PM)\s-\s([^:]+): (.+)/i // US M/D/YY AM/PM
];

function parseLine(line: string): Message | null {
    for (const regex of TIMESTAMP_REGEXES) {
        const match = line.match(regex);
        if (match) {
            // Handle the two regex cases separately or unify them
            // Case 1: DD/MM/YYYY (European/South American common)
            if (regex.toString().includes('PM')) {
                // Case 2: US Format M/D/YY AM/PM
                // Groups: 1=M, 2=D, 3=Y, 4=H, 5=m, 6=AM/PM, 7=Author, 8=Msg
                let year = parseInt(match[3]);
                if (year < 100) year += 2000;
                let hour = parseInt(match[4]);
                if (match[6].toUpperCase() === 'PM' && hour < 12) hour += 12;
                else if (match[6].toUpperCase() === 'AM' && hour === 12) hour = 0;

                const date = new Date(year, parseInt(match[1]) - 1, parseInt(match[2]), hour, parseInt(match[5]));
                return { date, author: match[7].trim(), content: match[8].trim() };
            } else {
                // Case 1: Standard [DD/MM/YYYY, HH:mm:ss]
                // Groups: 1=D, 2=M, 3=Y, 4=H, 5=m, 6=s(opt), 7=Author, 8=Msg
                let year = parseInt(match[3]);
                if (year < 100) year += 2000;
                const date = new Date(year, parseInt(match[2]) - 1, parseInt(match[1]), parseInt(match[4]), parseInt(match[5]));
                return { date, author: match[7].trim(), content: match[8].trim() };
            }
        }
    }
    return null;
}

export function parseChat(chatContent: string): WrappedData {
    const lines = chatContent.split(/\r?\n/);
    const messages: Message[] = [];

    // Basic parsing
    lines.forEach(line => {
        // Skip system messages or encrytion notices usually
        if (line.includes('Messages and calls are end-to-end encrypted') || line.includes('created group') || line.includes('added you')) return;

        // Attempt parsing
        const msg = parseLine(line);
        if (msg) {
            messages.push(msg);
        } else {
            // Multi-line message support: append to last message if exists
            if (messages.length > 0) {
                messages[messages.length - 1].content += '\n' + line;
            }
        }
    });

    if (messages.length === 0) {
        throw new Error("No messages found or date format not supported.");
    }

    // Calculate Statistics
    const totalMessages = messages.length;
    let totalWords = 0;
    let totalChars = 0;

    const senderCounts: Record<string, number> = {};
    const wordCounts: Record<string, number> = {};
    const emojiCounts: Record<string, number> = {};
    const messagesPerMonth: Record<number, number> = {};
    const messagesPerDay: Record<string, number> = {}; // YYYY-MM-DD -> count

    // Message Frequency Map for most frequent message detection (excluding short ones maybe?)
    const messageFrequency: Record<string, { count: number, author: string }> = {};

    // For streaks
    const dates = messages.map(m => m.date);
    dates.sort((a, b) => a.getTime() - b.getTime());

    // Determine year for the Wrapped (use the most frequent year or the last year?)
    // Usually Wrapped is for the current year. Let's assume we want to analyze the last full year present or this year.
    // For simplicity, let's take the year of the last message as the "Wrapped Year". 
    const lastDate = dates[dates.length - 1];
    const wrappedYear = lastDate.getFullYear();

    messages.forEach(msg => {
        if (msg.date.getFullYear() !== wrappedYear) return; // Only process the target year for detailed stats

        // Totals
        totalWords += msg.content.split(/\s+/).length;
        totalChars += msg.content.length;

        // Senders
        senderCounts[msg.author] = (senderCounts[msg.author] || 0) + 1;

        // Monthly stats
        const month = msg.date.getMonth() + 1; // 1-12
        messagesPerMonth[month] = (messagesPerMonth[month] || 0) + 1;

        // Daily stats (for peak day)
        const dayKey = msg.date.toISOString().split('T')[0];
        messagesPerDay[dayKey] = (messagesPerDay[dayKey] || 0) + 1;

        // Word Analysis (simple tokenization)
        const words = msg.content.toLowerCase().replace(/[^\w\s\u00C0-\u00FF]/g, '').split(/\s+/);
        words.forEach(w => {
            if (w.length > 2 && !STOP_WORDS.has(w)) {
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
        });

        // Emoji Analysis
        // Regex for emoji: very basic range, can be improved
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojis = msg.content.match(emojiRegex);
        if (emojis) {
            emojis.forEach(e => {
                emojiCounts[e] = (emojiCounts[e] || 0) + 1;
            });
        }

        // Most frequent message (exact match, case insensitive, ignore super short generic ones like "si", "no")
        const cleanedContent = msg.content.trim();
        if (cleanedContent.length > 3) {
            // Key by content + author to see who says what most, or just content?
            // Usually "Most frequent message" in wrapped is "Who said the same thing most times" or "What message was repeated most?"
            // Data interface: author, content, count. Implies one specific message instance repeated.
            const key = cleanedContent.toLowerCase(); // normalization
            if (!messageFrequency[key]) {
                messageFrequency[key] = { count: 0, author: msg.author }; // attribute to first/most freq author later
            }
            messageFrequency[key].count++;
            // Keep track of who says it most? Simplified: just keep the author of the current one, 
            // statistically if it's repeated, the main author will show up eventually or we can improve this loop.
        }
    });

    // Post-process aggregations

    // Top Senders
    const topSenders = Object.entries(senderCounts)
        .map(([name, count]) => ({ name, messages: count }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 5);

    // Top Words
    const topWords = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Top Emojis
    const topEmojis = Object.entries(emojiCounts)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // Peak Day
    let peakDate = '';
    let peakCount = 0;
    Object.entries(messagesPerDay).forEach(([date, count]) => {
        if (count > peakCount) {
            peakCount = count;
            peakDate = date;
        }
    });

    // Most Frequent Message
    let bestMsg = { author: '', content: '', count: 0 };
    Object.entries(messageFrequency).forEach(([key, val]) => {
        if (val.count > bestMsg.count) {
            bestMsg = { author: val.author, content: key, count: val.count }; // content here is lowercased, could improve store
        }
    });
    // Restore original content case if possible or leave lowercase? 
    // For now leave lowercase as key.

    // Streaks (Silence & Activity)
    // Re-calculate dates for the specific year only for strict correctness
    const yearDates = dates.filter(d => d.getFullYear() === wrappedYear);

    let longestActivity = { from: '', to: '', days: 0 };
    let longestSilence = { from: '', to: '', days: 0 };

    if (yearDates.length > 0) {
        // Dedup days for easier calc
        const uniqueDays = Array.from(new Set(yearDates.map(d => d.toISOString().split('T')[0]))).sort();

        let currentActivityStreak = 1;
        let currentSilenceStreak = 0;
        let lastDay = new Date(uniqueDays[0]);

        let actStart = uniqueDays[0];

        for (let i = 1; i < uniqueDays.length; i++) {
            const currentDay = new Date(uniqueDays[i]);
            const diffTime = Math.abs(currentDay.getTime() - lastDay.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                currentActivityStreak++;
            } else {
                // Gap found -> Check Activity Record
                if (currentActivityStreak > longestActivity.days) {
                    longestActivity = {
                        from: actStart,
                        to: uniqueDays[i - 1],
                        days: currentActivityStreak
                    };
                }
                // Reset Activity
                currentActivityStreak = 1;
                actStart = uniqueDays[i];

                // Silence Streak check (gap size - 1)
                const silenceDays = diffDays - 1;
                if (silenceDays > longestSilence.days) {
                    // Calculate silence dates
                    const silenceStart = new Date(lastDay);
                    silenceStart.setDate(silenceStart.getDate() + 1);
                    const silenceEnd = new Date(currentDay);
                    silenceEnd.setDate(silenceEnd.getDate() - 1);

                    longestSilence = {
                        from: silenceStart.toISOString().split('T')[0],
                        to: silenceEnd.toISOString().split('T')[0],
                        days: silenceDays
                    };
                }
            }
            lastDay = currentDay;
        }
        // Final check for activity streak
        if (currentActivityStreak > longestActivity.days) {
            longestActivity = {
                from: actStart,
                to: uniqueDays[uniqueDays.length - 1],
                days: currentActivityStreak
            };
        }
    }

    // New People (Naive implementation: everyone in this chat is "new" if we don't have historical context)
    // Or just list top 5 people? The interface defines "new_people" as string[]. 
    // Let's just put a placeholder or empty for now, as we can't really know who is "new" without previous year data.
    // Or maybe we treat "anyone who spoke in this year but not in the very first month of the chat" as new? Hard to say.
    // We'll leave it empty or mock it.
    const new_people: string[] = [];

    return {
        year: wrappedYear,
        group_name: "WhatsApp Group", // No easy way to get group name from export filename inside text content usually
        totals: {
            messages: totalMessages,
            words: totalWords,
            characters: totalChars
        },
        new_people,
        top_senders: topSenders,
        most_frequent_message: bestMsg,
        top_words: topWords,
        top_emojis: topEmojis,
        messages_per_month: messagesPerMonth,
        peak_activity_day: {
            date: peakDate,
            messages: peakCount
        },
        longest_activity_streak: longestActivity,
        longest_silence_streak: longestSilence
    };
}
