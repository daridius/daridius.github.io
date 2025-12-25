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

/**
 * Extrae la lista de participantes que aparecen en las estadísticas calculadas
 * y construye un mapa nombre -> índice
 */
function buildParticipantsMap(result: ParsedChatResult): { participants: string[], nameToIndex: Map<string, number> } {
    const participantsSet = new Set<string>();
    
    // Extraer nombres de mensajes (autores que enviaron mensajes)
    result.messages.forEach(msg => {
        if (msg.author) {
            participantsSet.add(cleanName(msg.author));
        }
    });
    
    // Extraer nombres de media (autores que enviaron media)
    result.media.forEach(msg => {
        if (msg.author) {
            participantsSet.add(cleanName(msg.author));
        }
    });
    
    // Extraer nombres de system messages (para polls)
    result.system.forEach(msg => {
        if (msg.author) {
            participantsSet.add(cleanName(msg.author));
        }
    });
    
    const participants = Array.from(participantsSet).sort();
    const nameToIndex = new Map<string, number>();
    participants.forEach((name, index) => {
        nameToIndex.set(name, index);
    });
    
    return { participants, nameToIndex };
}

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
    // PASO 1: Construir array de participantes y mapa nombre -> índice
    const { participants, nameToIndex } = buildParticipantsMap(result);
    
    console.log('\n========================================');
    console.log('👥 PARTICIPANTES DEL GRUPO:');
    console.log('========================================');
    console.log(`Total: ${participants.length} personas\n`);
    participants.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
    });
    console.log('========================================\n');
    
    // Construir objeto de stats - solo agregar lo que se puede calcular
    const stats: WrappedData = {
        year: 2025,
        group_name: groupName,
        participants: participants,
    };
    
    // Calcular cada estadística individualmente
    const totals = getTotals(result);
    if (totals) stats.totals = totals;
    
    const topSenders = getTopSenders(result);
    if (topSenders) {
        stats.top_senders = topSenders.map(s => ({
            nameIndex: nameToIndex.get(s.name)!,
            messages: s.messages
        }));
    }
    
    const topDeleters = getTopDeleters(result);
    if (topDeleters) {
        stats.top_deleters = topDeleters.map(d => ({
            nameIndex: nameToIndex.get(d.name)!,
            deleted: d.deleted
        }));
    }
    
    const topEditors = getTopEditors(result);
    if (topEditors) {
        stats.top_editors = topEditors.map(e => ({
            nameIndex: nameToIndex.get(e.name)!,
            edited: e.edited
        }));
    }
    
    const mostFrequent = getMostFrequentMessage(result);
    if (mostFrequent) {
        stats.most_frequent_message = mostFrequent.map(m => ({
            authorIndex: nameToIndex.get(m.author)!,
            content: m.content,
            count: m.count
        }));
    }
    
    const topWords = getTopWords(result);
    if (topWords) stats.top_words = topWords;
    
    const topEmojis = getTopEmojis(result);
    if (topEmojis) stats.top_emojis = topEmojis;
    
    const messagesPerMonth = getMessagesPerMonth(result);
    if (messagesPerMonth) stats.messages_per_month = messagesPerMonth;
    
    const peakDay = getPeakActivityDay(result);
    if (peakDay) stats.peak_activity_day = peakDay;
    
    const silenceStreak = getLongestSilenceStreak(result);
    if (silenceStreak) stats.longest_silence_streak = silenceStreak;
    
    const activityStreak = getLongestActivityStreak(result);
    if (activityStreak) stats.longest_activity_streak = activityStreak;
    
    const topStickers = getTopStickers(result, attachmentsMap);
    if (topStickers) stats.top_stickers = topStickers;
    
    const topStickerSenders = getTopStickerSenders(result, attachmentsMap);
    if (topStickerSenders) {
        stats.top_sticker_senders = topStickerSenders.map(s => ({
            nameIndex: nameToIndex.get(s.name)!,
            sticker: s.sticker,
            count: s.count
        }));
    }
    
    const mostStickerSender = getMostStickerSender(result);
    if (mostStickerSender) {
        stats.most_sticker_sender = {
            nameIndex: nameToIndex.get(mostStickerSender.name)!,
            stickers: mostStickerSender.stickers
        };
    }
    
    const mostAudioSender = getMostAudioSender(result);
    if (mostAudioSender) {
        stats.most_audio_sender = {
            nameIndex: nameToIndex.get(mostAudioSender.name)!,
            audios: mostAudioSender.audios
        };
    }
    
    const mostLocationSender = getMostLocationSender(result);
    if (mostLocationSender) {
        stats.most_location_sender = {
            nameIndex: nameToIndex.get(mostLocationSender.name)!,
            locations: mostLocationSender.locations
        };
    }
    
    const mostPollStarter = getMostPollStarter(result);
    if (mostPollStarter) {
        stats.most_poll_starter = {
            nameIndex: nameToIndex.get(mostPollStarter.name)!,
            polls: mostPollStarter.polls
        };
    }
    
    const mostImageSender = getMostImageSender(result);
    if (mostImageSender) {
        stats.most_image_sender = {
            nameIndex: nameToIndex.get(mostImageSender.name)!,
            images: mostImageSender.images
        };
    }
    
    const mostVideoSender = getMostVideoSender(result);
    if (mostVideoSender) {
        stats.most_video_sender = {
            nameIndex: nameToIndex.get(mostVideoSender.name)!,
            videos: mostVideoSender.videos
        };
    }
    
    const mostDocumentSender = getMostDocumentSender(result);
    if (mostDocumentSender) {
        stats.most_document_sender = {
            nameIndex: nameToIndex.get(mostDocumentSender.name)!,
            documents: mostDocumentSender.documents
        };
    }
    
    console.log('📊 ESTADÍSTICAS CALCULADAS:');
    const calculatedStats = Object.keys(stats).filter(k => k !== 'year' && k !== 'group_name');
    console.log('  Propiedades incluidas:', calculatedStats.length > 0 ? calculatedStats : '(ninguna)');
    if (totals) console.log(`  ✓ totals: ${totals.messages} mensajes, ${totals.words} palabras`);
    if (topSenders) console.log(`  ✓ top_senders: ${topSenders.length} personas`);
    if (topDeleters) {
        console.log(`  ✓ top_deleters: ${topDeleters.length} personas`);
        topDeleters.forEach((d, i) => {
            console.log(`      ${i + 1}. ${d.name} (${d.deleted} eliminados)`);
        });
    }
    if (topEditors) {
        console.log(`  ✓ top_editors: ${topEditors.length} personas`);
        topEditors.forEach((e, i) => {
            console.log(`      ${i + 1}. ${e.name} (${e.edited} editados)`);
        });
    }
    if (mostFrequent) {
        console.log(`  ✓ most_frequent_message: ${mostFrequent.length} mensajes`);
        mostFrequent.forEach((m, i) => {
            console.log(`      ${i + 1}. "${m.content.substring(0, 30)}..." (${m.count} veces)`);
        });
    }
    if (topWords) console.log(`  ✓ top_words: ${topWords.length} palabras`);
    if (topEmojis) console.log(`  ✓ top_emojis: ${topEmojis.length} emojis`);
    if (messagesPerMonth) console.log(`  ✓ messages_per_month: ${Object.keys(messagesPerMonth).length} meses`);
    if (peakDay) console.log(`  ✓ peak_activity_day: ${peakDay.date} (${peakDay.messages} mensajes)`);
    if (silenceStreak) console.log(`  ✓ longest_silence_streak: ${silenceStreak.days} días`);
    if (activityStreak) console.log(`  ✓ longest_activity_streak: ${activityStreak.days} días`);
    if (topStickers) console.log(`  ✓ top_stickers: ${topStickers.length} stickers`);
    if (topStickerSenders) {
        console.log(`  ✓ top_sticker_senders: ${topStickerSenders.length} combinaciones (autor, sticker)`);
        topStickerSenders.forEach((s, i) => {
            console.log(`      ${i + 1}. ${s.name} - ${s.sticker} (${s.count} veces)`);
        });
    }
    if (mostStickerSender) console.log(`  ✓ most_sticker_sender: ${mostStickerSender.name} (${mostStickerSender.stickers} stickers)`);
    if (mostAudioSender) console.log(`  ✓ most_audio_sender: ${mostAudioSender.name} (${mostAudioSender.audios} audios)`);
    if (mostLocationSender) console.log(`  ✓ most_location_sender: ${mostLocationSender.name} (${mostLocationSender.locations} ubicaciones)`);
    if (mostPollStarter) console.log(`  ✓ most_poll_starter: ${mostPollStarter.name} (${mostPollStarter.polls} encuestas)`);
    if (mostImageSender) console.log(`  ✓ most_image_sender: ${mostImageSender.name} (${mostImageSender.images} imágenes)`);
    if (mostVideoSender) console.log(`  ✓ most_video_sender: ${mostVideoSender.name} (${mostVideoSender.videos} videos)`);
    if (mostDocumentSender) console.log(`  ✓ most_document_sender: ${mostDocumentSender.name} (${mostDocumentSender.documents} documentos)`);
    console.log('');
    
    return stats;
}
