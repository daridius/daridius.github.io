import type { WrappedData } from '../data';
import type { ParsedChatResult } from './messageParser';

/**
 * FASE 2: STATS CALCULATOR
 * 
 * Este archivo se encarga de:
 * 1. Recibir los mensajes parseados (messages, media, system)
 * 2. Extraer metadata (participantes, etc.)
 * 3. Calcular todas las estadísticas del Wrapped
 * 4. Retornar el objeto WrappedData completo
 */

/**
 * Limpia un nombre: trim y remueve puntos finales
 */
function cleanName(name: string): string {
    return name.trim().replace(/\.+$/, '');
}

/** @file statsCalculator.ts */

/**
 * Calcula totales: mensajes, palabras y caracteres
 * Los mensajes eliminados y media cuentan como mensajes sin palabras
 */
function getTotals(result: ParsedChatResult) {
    // Contar todos los mensajes (incluyendo eliminados y media)
    // Los eliminados están en system con type='deleted'
    const deletedCount = result.system.filter(s => s.type === 'deleted').length;
    const totalMessages = result.messages.length + result.media.length + deletedCount;

    if (totalMessages === 0) return undefined;

    // Solo contar palabras y caracteres de mensajes normales (result.messages ya son solo normales)
    const words = result.messages.reduce((sum, m) => {
        return sum + m.content.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);

    const characters = result.messages.reduce((sum, m) => sum + m.content.length, 0);

    return {
        messages: totalMessages,
        words,
        characters
    };
}

/**
 * Calcula top senders por cantidad de mensajes
 * Incluye mensajes eliminados y media
 */
function getTopSenders(result: ParsedChatResult) {
    const senderCounts = new Map<string, number>();

    // Contar todos los mensajes (incluyendo eliminados)
    result.messages.forEach(m => {
        if (m.author) {
            const name = cleanName(m.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    // Contar media
    result.media.forEach(m => {
        if (m.author) {
            const name = cleanName(m.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    if (senderCounts.size === 0) return undefined;

    return Array.from(senderCounts.entries())
        .map(([name, messages]) => ({ name, messages }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 5);
}

/**
 * Calcula top 3 personas que eliminaron más mensajes
 */
function getTopDeleters(result: ParsedChatResult) {
    const deleterCounts = new Map<string, number>();

    // Iterar sobre system messages buscando type='deleted'
    result.system.forEach(s => {
        if (s.author && s.type === 'deleted') {
            const name = cleanName(s.author);
            deleterCounts.set(name, (deleterCounts.get(name) || 0) + 1);
        }
    });

    if (deleterCounts.size === 0) return undefined;

    const topDeleters = Array.from(deleterCounts.entries())
        .map(([name, deleted]) => ({ name, deleted }))
        .filter(item => item.deleted > 3) // Minimum threshold > 3
        .sort((a, b) => b.deleted - a.deleted)
        .slice(0, 1); // Only top 1

    if (topDeleters.length === 0) return undefined;

    return topDeleters;
}

/**
 * Calcula top 3 personas que editaron más mensajes
 */
function getTopEditors(result: ParsedChatResult) {
    const editorCounts = new Map<string, number>();

    result.messages.forEach(m => {
        if (m.author && m.edited) {
            const name = cleanName(m.author);
            editorCounts.set(name, (editorCounts.get(name) || 0) + 1);
        }
    });

    if (editorCounts.size === 0) return undefined;

    const topEditors = Array.from(editorCounts.entries())
        .map(([name, edited]) => ({ name, edited }))
        .filter(item => item.edited > 3) // Minimum threshold > 3
        .sort((a, b) => b.edited - a.edited)
        .slice(0, 1); // Only top 1

    if (topEditors.length === 0) return undefined;

    return topEditors;
}

/**
 * Encuentra los 3 mensajes más frecuentes
 */
function getMostFrequentMessage(result: ParsedChatResult) {
    const messageCounts = new Map<string, { author: string; count: number }>();

    result.messages.forEach(m => {
        if (m.author && m.content.trim().length > 0) {
            const key = m.content.trim().toLowerCase();
            const author = cleanName(m.author);
            const existing = messageCounts.get(key);
            if (existing) {
                existing.count++;
            } else {
                messageCounts.set(key, { author, count: 1 });
            }
        }
    });

    if (messageCounts.size === 0) return undefined;

    // Ordenar por count y tomar top 3
    const topMessages = Array.from(messageCounts.entries())
        .map(([content, data]) => ({
            content: content.length > 50 ? content.substring(0, 50) : content,
            author: data.author,
            count: data.count
        }))
        .filter(m => m.count >= 2) // Al menos 2 repeticiones
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    if (topMessages.length === 0) return undefined;

    return topMessages;
}

/**
 * Calcula las palabras más usadas
 */
function getTopWords(result: ParsedChatResult) {
    const wordCounts = new Map<string, number>();
    const stopWords = new Set([
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
        'media', 'omitted', 'multimedia', 'omitido', 'imagen', 'video', 'audio', 'sticker', 'gif', 'null', 'nan',
        'the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
        'but', 'his', 'by', 'from'
    ]);

    result.messages.forEach(m => {
        if (m.content) {
            const words = m.content.toLowerCase().split(/\s+/);
            words.forEach(word => {
                const clean = word.replace(/[^a-záéíóúñü]/gi, '');
                if (clean.length > 3 && !stopWords.has(clean)) {
                    wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
                }
            });
        }
    });

    if (wordCounts.size === 0) return undefined;

    return Array.from(wordCounts.entries())
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

/**
 * Calcula los emojis más usados
 */
function getTopEmojis(result: ParsedChatResult) {
    const emojiCounts = new Map<string, number>();
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

    result.messages.forEach(m => {
        if (m.content) {
            const emojis = m.content.match(emojiRegex);
            if (emojis) {
                emojis.forEach(emoji => {
                    emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
                });
            }
        }
    });

    if (emojiCounts.size === 0) return undefined;

    return Array.from(emojiCounts.entries())
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

/**
 * Calcula mensajes por mes
 */
function getMessagesPerMonth(result: ParsedChatResult) {
    const monthCounts: Record<number, number> = {};

    result.messages.forEach(m => {
        const month = m.date.getMonth() + 1; // 1-12
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    if (Object.keys(monthCounts).length === 0) return undefined;

    return monthCounts;
}

/**
 * Encuentra el día con más actividad
 */
function getPeakActivityDay(result: ParsedChatResult) {
    const dayCounts = new Map<string, number>();

    result.messages.forEach(m => {
        const dateStr = m.date.toISOString().split('T')[0]; // YYYY-MM-DD
        dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
    });

    if (dayCounts.size === 0) return undefined;

    let peak = { date: '', messages: 0 };
    dayCounts.forEach((count, date) => {
        if (count > peak.messages) {
            peak = { date, messages: count };
        }
    });

    return peak;
}

/**
 * Calcula la racha de silencio más larga
 * Incluye mensajes de texto y media
 */
function getLongestSilenceStreak(result: ParsedChatResult) {
    // Combinar mensajes de texto y media
    const allActivity = [
        ...result.messages.map(m => m.date),
        ...result.media.map(m => m.date)
    ].sort((a, b) => a.getTime() - b.getTime());

    if (allActivity.length < 2) return undefined;

    let longestGap = { from: '', to: '', days: 0 };

    for (let i = 1; i < allActivity.length; i++) {
        const prev = allActivity[i - 1];
        const curr = allActivity[i];
        const gapMs = curr.getTime() - prev.getTime();
        const gapDays = Math.floor(gapMs / (1000 * 60 * 60 * 24));

        if (gapDays > longestGap.days) {
            longestGap = {
                from: prev.toISOString().split('T')[0],
                to: curr.toISOString().split('T')[0],
                days: gapDays
            };
        }
    }

    if (longestGap.days < 1) return undefined;

    return longestGap;
}

/**
 * Calcula la racha de actividad más larga (días consecutivos con mensajes)
 * Incluye mensajes de texto y media
 */
function getLongestActivityStreak(result: ParsedChatResult) {
    // Combinar mensajes de texto y media
    const allActivity = [
        ...result.messages.map(m => m.date),
        ...result.media.map(m => m.date)
    ];

    if (allActivity.length === 0) return undefined;

    // Obtener días únicos
    const uniqueDays = new Set(
        allActivity.map(d => d.toISOString().split('T')[0])
    );
    const sortedDays = Array.from(uniqueDays).sort();

    if (sortedDays.length < 2) return undefined;

    let currentStreak = { from: sortedDays[0], to: sortedDays[0], days: 1 };
    let longestStreak = { ...currentStreak };

    for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1]);
        const currDate = new Date(sortedDays[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutivo
            currentStreak.to = sortedDays[i];
            currentStreak.days++;
        } else {
            // Se cortó la racha
            if (currentStreak.days > longestStreak.days) {
                longestStreak = { ...currentStreak };
            }
            currentStreak = { from: sortedDays[i], to: sortedDays[i], days: 1 };
        }
    }

    // Chequear la última racha
    if (currentStreak.days > longestStreak.days) {
        longestStreak = { ...currentStreak };
    }

    if (longestStreak.days < 2) return undefined;

    return longestStreak;
}

/**
 * Obtiene los 5 stickers más enviados
 * Los stickers tienen contenido específico o fileName que podemos usar para agrupar
 */
function getTopStickers(result: ParsedChatResult, attachmentsMap?: Map<string, string>) {
    const stickers = result.media.filter(m => m.type === 'sticker');

    if (stickers.length === 0) return undefined;

    // Agrupar por fileName (si existe) o por author+date como identificador
    const stickerCounts = new Map<string, number>();

    stickers.forEach(sticker => {
        // Usamos el fileName como identificador del sticker
        // Si no hay fileName, usamos un placeholder
        const key = sticker.fileName || 'unknown';
        stickerCounts.set(key, (stickerCounts.get(key) || 0) + 1);
    });

    const sorted = Array.from(stickerCounts.entries())
        .map(([fileName, count]) => {
            // Try to get base64 content from map, otherwise keep fileName to extract later
            const content = attachmentsMap?.get(fileName) || fileName;
            return { content, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return sorted.length > 0 ? sorted : undefined;
}

/**
 * Obtiene el top 3 de combinaciones (autor, sticker) más enviadas
 */
function getTopStickerSenders(result: ParsedChatResult, attachmentsMap?: Map<string, string>) {
    const stickers = result.media.filter(m => m.type === 'sticker' && m.author);

    if (stickers.length === 0) return undefined;

    // Agrupar por (autor, sticker)
    const combinationCounts = new Map<string, { name: string; sticker: string; count: number }>();

    stickers.forEach(sticker => {
        if (sticker.author) {
            const stickerName = sticker.fileName || 'unknown';
            const name = cleanName(sticker.author);
            const key = `${name}|${stickerName}`;

            if (combinationCounts.has(key)) {
                combinationCounts.get(key)!.count++;
            } else {
                combinationCounts.set(key, {
                    name,
                    sticker: stickerName,
                    count: 1
                });
            }
        }
    });

    const sorted = Array.from(combinationCounts.values())
        .map(item => {
            // Try to get base64 content from map, otherwise keep fileName to extract later
            const content = attachmentsMap?.get(item.sticker) || item.sticker;
            return { ...item, sticker: content };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    return sorted.length > 0 ? sorted : undefined;
}

/**
 * Obtiene la persona que más stickers mandó en total (mínimo 3)
 */
function getMostStickerSender(result: ParsedChatResult) {
    const stickers = result.media.filter(m => m.type === 'sticker' && m.author);

    if (stickers.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    stickers.forEach(sticker => {
        if (sticker.author) {
            const name = cleanName(sticker.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, stickers]) => ({ name, stickers }))
        .sort((a, b) => b.stickers - a.stickers);

    // Mínimo 3 stickers
    return sorted.length > 0 && sorted[0].stickers >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que mandó más audios (mínimo 3)
 */
function getMostAudioSender(result: ParsedChatResult) {
    const audios = result.media.filter(m => m.type === 'audio' && m.author);

    if (audios.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    audios.forEach(audio => {
        if (audio.author) {
            const name = cleanName(audio.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, audios]) => ({ name, audios }))
        .sort((a, b) => b.audios - a.audios);

    // Mínimo 3 audios
    return sorted.length > 0 && sorted[0].audios >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que compartió más ubicaciones (mínimo 3)
 */
function getMostLocationSender(result: ParsedChatResult) {
    const locations = result.media.filter(m => m.type === 'location' && m.author);

    if (locations.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    locations.forEach(location => {
        if (location.author) {
            const name = cleanName(location.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, locations]) => ({ name, locations }))
        .sort((a, b) => b.locations - a.locations);

    // Mínimo 3 ubicaciones
    return sorted.length > 0 && sorted[0].locations >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que inició más votaciones (mínimo 3)
 */
function getMostPollStarter(result: ParsedChatResult) {
    const polls = result.system.filter(m => m.type === 'poll' && m.author);

    if (polls.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    polls.forEach(poll => {
        if (poll.author) {
            const name = cleanName(poll.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, polls]) => ({ name, polls }))
        .sort((a, b) => b.polls - a.polls);

    // Mínimo 3 encuestas
    return sorted.length > 0 && sorted[0].polls >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que mandó más imágenes (mínimo 3)
 */
function getMostImageSender(result: ParsedChatResult) {
    const images = result.media.filter(m => m.type === 'image' && m.author);

    if (images.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    images.forEach(image => {
        if (image.author) {
            const name = cleanName(image.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, images]) => ({ name, images }))
        .sort((a, b) => b.images - a.images);

    // Mínimo 3 imágenes
    return sorted.length > 0 && sorted[0].images >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que mandó más videos (mínimo 3)
 */
function getMostVideoSender(result: ParsedChatResult) {
    const videos = result.media.filter(m => m.type === 'video' && m.author);

    if (videos.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    videos.forEach(video => {
        if (video.author) {
            const name = cleanName(video.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, videos]) => ({ name, videos }))
        .sort((a, b) => b.videos - a.videos);

    // Mínimo 3 videos
    return sorted.length > 0 && sorted[0].videos >= 3 ? sorted[0] : undefined;
}

/**
 * Obtiene la persona que mandó más documentos (mínimo 3)
 */
function getMostDocumentSender(result: ParsedChatResult) {
    const documents = result.media.filter(m => m.type === 'document' && m.author);

    if (documents.length === 0) return undefined;

    const senderCounts = new Map<string, number>();

    documents.forEach(doc => {
        if (doc.author) {
            const name = cleanName(doc.author);
            senderCounts.set(name, (senderCounts.get(name) || 0) + 1);
        }
    });

    const sorted = Array.from(senderCounts.entries())
        .map(([name, documents]) => ({ name, documents }))
        .sort((a, b) => b.documents - a.documents);

    // Mínimo 3 documentos
    return sorted.length > 0 && sorted[0].documents >= 3 ? sorted[0] : undefined;
}

// TODO: Implementar el cálculo de estadísticas
// Este archivo contendrá toda la lógica de agregación de datos que actualmente está en chatParser.ts

export function calculateStats(result: ParsedChatResult, groupName: string, attachmentsMap?: Map<string, string>): WrappedData {
    // 1. Calcular estadísticas individuales (devuelven nombres, no índices aún)
    const totals = getTotals(result);
    const topSendersRaw = getTopSenders(result);
    const topDeletersRaw = getTopDeleters(result);
    const topEditorsRaw = getTopEditors(result);
    const mostFrequentRaw = getMostFrequentMessage(result);
    const topWords = getTopWords(result);
    const topEmojis = getTopEmojis(result);
    const messagesPerMonth = getMessagesPerMonth(result);
    const peakDay = getPeakActivityDay(result);
    const silenceStreak = getLongestSilenceStreak(result);
    const activityStreak = getLongestActivityStreak(result);
    const topStickers = getTopStickers(result, attachmentsMap);
    const topStickerSendersRaw = getTopStickerSenders(result, attachmentsMap);
    const mostStickerSenderRaw = getMostStickerSender(result);
    const mostAudioSenderRaw = getMostAudioSender(result);
    const mostLocationSenderRaw = getMostLocationSender(result);
    const mostPollStarterRaw = getMostPollStarter(result);
    const mostImageSenderRaw = getMostImageSender(result);
    const mostVideoSenderRaw = getMostVideoSender(result);
    const mostDocumentSenderRaw = getMostDocumentSender(result);

    // 2. Colectar estrictamente los nombres que aparecen en las slides finales
    const relevantNames = new Set<string>();
    const add = (name?: string) => { if (name) relevantNames.add(name); };

    topSendersRaw?.forEach(s => add(s.name));
    topDeletersRaw?.forEach(d => add(d.name));
    topEditorsRaw?.forEach(e => add(e.name));
    mostFrequentRaw?.forEach(m => add(m.author));
    // Media winners
    add(mostStickerSenderRaw?.name);
    add(mostAudioSenderRaw?.name);
    add(mostLocationSenderRaw?.name);
    add(mostPollStarterRaw?.name);
    add(mostImageSenderRaw?.name);
    add(mostVideoSenderRaw?.name);
    add(mostDocumentSenderRaw?.name);
    // Sticker top individual
    if (topStickerSendersRaw && topStickerSendersRaw.length > 0) {
        add(topStickerSendersRaw[0].name);
    }

    // 3. Crear lista final de participantes y mapa para remap de índices
    const participants = Array.from(relevantNames).sort();
    const nameToIndex = new Map<string, number>();
    participants.forEach((name, idx) => nameToIndex.set(name, idx));

    // 4. Construir objeto final WrappedData mapeando nombres a índices
    const stats: WrappedData = {
        year: 2025,
        group_name: groupName,
        participants: participants
    };

    if (totals) stats.totals = totals;
    if (topWords) stats.top_words = topWords;
    if (topEmojis) stats.top_emojis = topEmojis;
    if (messagesPerMonth) stats.messages_per_month = messagesPerMonth;
    if (peakDay) stats.peak_activity_day = peakDay;
    if (silenceStreak) stats.longest_silence_streak = silenceStreak;
    if (activityStreak) stats.longest_activity_streak = activityStreak;
    if (topStickers) stats.top_stickers = topStickers;

    // Mapeo de índices
    if (topSendersRaw) {
        stats.top_senders = topSendersRaw.map(s => ({
            nameIndex: nameToIndex.get(s.name)!,
            messages: s.messages
        }));
    }
    if (topDeletersRaw) {
        stats.top_deleters = topDeletersRaw.map(d => ({
            nameIndex: nameToIndex.get(d.name)!,
            deleted: d.deleted
        }));
    }
    if (topEditorsRaw) {
        stats.top_editors = topEditorsRaw.map(e => ({
            nameIndex: nameToIndex.get(e.name)!,
            edited: e.edited
        }));
    }
    if (mostFrequentRaw) {
        stats.most_frequent_message = mostFrequentRaw.map(m => ({
            authorIndex: nameToIndex.get(m.author)!,
            content: m.content,
            count: m.count
        }));
    }
    if (topStickerSendersRaw && topStickerSendersRaw.length > 0) {
        stats.top_sticker_senders = [{
            nameIndex: nameToIndex.get(topStickerSendersRaw[0].name)!,
            sticker: topStickerSendersRaw[0].sticker,
            count: topStickerSendersRaw[0].count
        }];
    }

    // Media Kings
    if (mostStickerSenderRaw) stats.most_sticker_sender = { nameIndex: nameToIndex.get(mostStickerSenderRaw.name)!, stickers: mostStickerSenderRaw.stickers };
    if (mostAudioSenderRaw) stats.most_audio_sender = { nameIndex: nameToIndex.get(mostAudioSenderRaw.name)!, audios: mostAudioSenderRaw.audios };
    if (mostLocationSenderRaw) stats.most_location_sender = { nameIndex: nameToIndex.get(mostLocationSenderRaw.name)!, locations: mostLocationSenderRaw.locations };
    if (mostPollStarterRaw) stats.most_poll_starter = { nameIndex: nameToIndex.get(mostPollStarterRaw.name)!, polls: mostPollStarterRaw.polls };
    if (mostImageSenderRaw) stats.most_image_sender = { nameIndex: nameToIndex.get(mostImageSenderRaw.name)!, images: mostImageSenderRaw.images };
    if (mostVideoSenderRaw) stats.most_video_sender = { nameIndex: nameToIndex.get(mostVideoSenderRaw.name)!, videos: mostVideoSenderRaw.videos };
    if (mostDocumentSenderRaw) stats.most_document_sender = { nameIndex: nameToIndex.get(mostDocumentSenderRaw.name)!, documents: mostDocumentSenderRaw.documents };

    console.log(`✅ Stats calculadas. Participantes en slides: ${participants.length}`);
    return stats;
}
