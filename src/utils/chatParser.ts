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

const TIMESTAMP_REGEXES = [
    // 1. M/D/YY, H:mm AM/PM - Author: Message (Android/US)
    // Priority to AM/PM to avoid misattribution to author name
    /^(\d{1,2})[./](\d{1,2})[./](\d{2,4}),?\s+(\d{1,2}):(\d{2})[\s\u202f]*(AM|PM|am|pm)?[\s\u200e]*-?[\s\u200e]*([^:]+): (.+)/i,
    // 2. [DD/MM/YYYY, HH:mm:ss] Author: Message (iOS)
    /^\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4}),?\s+(\d{1,2}):(\d{2}):?(\d{2})?\]?[\s\u200e]*-?[\s\u200e]*([^:]+): (.+)/
];

const IGNORE_PATTERNS = [
    /Messages and calls are end-to-end encrypted/i,
    /Mensajes y llamadas están cifrados de extremo a extremo/i,
    /<Media omitted>/i,
    /<Archivo omitido>/i,
    /<Multimedia omitido>/i,
    /multimedia omitida/i,
    /This message was edited/i,
    /Este mensaje fue editado/i,
    /You deleted this message/i,
    /Eliminaste este mensaje/i,
    /deleted this message/i,
    /eliminó este mensaje/i,
    /created group/i,
    /creó el grupo/i,
    /added you/i,
    /te agregó/i,
    /changed this group's icon/i,
    /cambió el icono de este grupo/i,
    /changed the group description/i,
    /cambió la descripción del grupo/i,
    /missed voice call/i,
    /perdiste una llamada/i,
    /missed video call/i,
    /perdiste una videollamada/i,
    /Waiting for this message/i,
    /Esperando este mensaje/i
];

function parseLine(line: string): Message | null {
    // Priority 1: US/Android Format with AM/PM
    const ampmMatch = line.match(TIMESTAMP_REGEXES[0]);
    if (ampmMatch) {
        let year = parseInt(ampmMatch[3]);
        if (year < 100) year += 2000;
        let hour = parseInt(ampmMatch[4]);
        const ampm = ampmMatch[6]?.toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        else if (ampm === 'AM' && hour === 12) hour = 0;

        const date = new Date(year, parseInt(ampmMatch[1]) - 1, parseInt(ampmMatch[2]), hour, parseInt(ampmMatch[5]));
        return { date, author: ampmMatch[7].trim(), content: ampmMatch[8].trim() };
    }

    // Priority 2: Standard/iOS Format
    const stdMatch = line.match(TIMESTAMP_REGEXES[1]);
    if (stdMatch) {
        let year = parseInt(stdMatch[3]);
        if (year < 100) year += 2000;
        const date = new Date(year, parseInt(stdMatch[2]) - 1, parseInt(stdMatch[1]), parseInt(stdMatch[4]), parseInt(stdMatch[5]));
        return { date, author: stdMatch[7].trim(), content: stdMatch[8].trim() };
    }

    return null;
}

export function parseChat(chatContent: string): WrappedData {
    const lines = chatContent.split(/\r?\n/);
    const messages: Message[] = [];

    let groupName = "WhatsApp Group";

    // Basic parsing
    lines.forEach(line => {
        // Detect group name from creation message
        const creationMatch = line.match(/(?:created group|creó el grupo) "(.+)"/i);
        if (creationMatch) groupName = creationMatch[1];

        // Skip system messages or noisy content
        if (IGNORE_PATTERNS.some(p => p.test(line))) return;

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

        // Most frequent message (exact match, case insensitive, truncate to 50 chars)
        let cleanedContent = msg.content.trim();
        if (cleanedContent.length > 3) {
            // Apply 50 char limit to avoid massive strings in hash
            if (cleanedContent.length > 50) {
                cleanedContent = cleanedContent.substring(0, 50) + "...";
            }

            const key = cleanedContent.toLowerCase();
            if (!messageFrequency[key]) {
                messageFrequency[key] = { count: 0, author: msg.author };
            }
            messageFrequency[key].count++;
        }

    });

    // Post-process aggregations

    // Top Senders
    const topSenders = Object.entries(senderCounts)
        .map(([name, count]) => ({ name, messages: count }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 3);

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
        group_name: groupName,
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
