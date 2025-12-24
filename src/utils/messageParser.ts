import { parseString } from 'whatsapp-chat-parser';

/**
 * FASE 1: MESSAGE PARSER
 * 
 * NUEVA ESTRATEGIA:
 * No descartamos mensajes, los clasificamos TODOS con metadata
 * 
 * Categorías:
 * - OS: IOS | ANDROID | UNKNOWN
 * - LANG: EN | ES | UNKNOWN
 * - CATEGORY: NORMAL | SYSTEM | MEDIA
 * - TYPE: Específico por caso (deleted, audio_omitted, video_omitted, location, call, etc.)
 */

/**
 * TEMPLATE DE CLASIFICACIÓN
 * 
 * Ejemplo de estructura de un mensaje clasificado:
 * 
 * {
 *   date: Date,
 *   author: string | null,
 *   content: string,
 *   metadata: {
 *     os: 'IOS' | 'ANDROID' | 'UNKNOWN',
 *     lang: 'EN' | 'ES' | 'UNKNOWN',
 *     category: 'NORMAL' | 'SYSTEM' | 'MEDIA',
 *     type: string  // 'text', 'deleted', 'audio_omitted', 'video_omitted', 'image_omitted', 
 *                   // 'sticker_omitted', 'gif_omitted', 'location', 'encryption_notice', 
 *                   // 'group_created', 'user_added', 'icon_changed', 'missed_call', etc.
 *   },
 *   attachment?: {  // Solo si parseAttachments: true detectó algo
 *     fileName: string
 *   }
 * }
 * 
 * PATRONES DE DETECCIÓN (Regex):
 * 
 * CATEGORY: MEDIA
 * - iOS English:    /<Media omitted>/i
 * - iOS Spanish:    /imagen omitida|video omitido|audio omitido|sticker omitido|GIF omitido/i
 * - Android:        /<Multimedia omitido>|<Archivo omitido>/i
 * 
 * CATEGORY: SYSTEM
 * - Encryption:     /end-to-end encrypted|cifrados de extremo a extremo/i
 * - Deleted:        /deleted this message|eliminó este mensaje|You deleted/i
 * - Edited:         /This message was edited|Este mensaje fue editado/i
 * - Group:          /created group|creó el grupo/i
 * - User added:     /added you|te agregó/i
 * - Icon change:    /changed this group's icon|cambió el icono/i
 * - Description:    /changed the group description|cambió la descripción/i
 * - Calls:          /missed voice call|missed video call|perdiste una llamada/i
 * - Waiting:        /Waiting for this message|Esperando este mensaje/i
 * 
 * LANG Detection:
 * - EN: imagen → image, video → video, eliminó → deleted, creó → created
 * - ES: imagen, video, eliminó, creó, agregó, cambió
 * 
 * OS Detection:
 * - iOS tiende a ser más específico con tipos de media
 * - Android usa términos más genéricos como "Multimedia omitido"
 */

export interface ParsedMessage {
    date: Date;
    author: string | null;
    content: string;
    attachment?: {
        fileName: string;
    };
    edited?: boolean; // true si el mensaje fue editado
    deleted?: boolean; // true si el mensaje fue eliminado
}

/**
 * CATEGORÍAS DE MEDIA POSIBLES
 * 
 * Detectables por contenido del mensaje:
 * - image: Imagen/foto
 * - video: Video
 * - audio: Audio/nota de voz
 * - sticker: Sticker
 * - gif: GIF animado
 * - document: Documento/archivo
 * - contact: Contacto compartido
 * - location: Ubicación compartida
 * - omitted: Media genérica sin tipo específico
 * 
 * Detectables por attachment (cuando hay archivo real):
 * - [tipo]_attached: Cualquiera de los anteriores cuando hay fileName
 */
export type MediaType = 
    | 'image' 
    | 'video' 
    | 'audio' 
    | 'sticker' 
    | 'gif' 
    | 'document'
    | 'contact'
    | 'location'
    | 'omitted';

export interface MediaMessage {
    date: Date;
    author: string | null;
    type: MediaType;
    fileName: string | null; // null cuando es "omitted", string cuando hay attachment real
}

export type SystemType = 
    | 'encryption'
    | 'group_created'
    | 'group_renamed'
    | 'user_added'
    | 'user_removed'
    | 'user_left'
    | 'call_missed'
    | 'poll'
    | 'event'
    | 'location_shared'
    | 'undefined';

export interface SystemMessage {
    date: Date;
    author: string | null;
    type: SystemType;
    content: string;
}

export interface ParsedChatResult {
    messages: ParsedMessage[];
    media: MediaMessage[];
    system: SystemMessage[];
}

/**
 * Detecta el tipo de media por la extensión del archivo adjunto
 * Los archivos de WhatsApp tienen prefijos que indican el tipo:
 * - IMG-*.jpg/jpeg/png → image
 * - VID-*.mp4/3gp → video
 * - PTT-*.opus → audio (Push To Talk - nota de voz)
 * - AUD-*.opus/aac/m4a/mp3 → audio
 * - STK-*.webp → sticker
 * - *.pdf/doc/docx/xls/xlsx/ppt/pptx → document
 * - *.vcf → contact
 * - *.zip/rar/7z → document
 */
function detectMediaByAttachment(
    attachment: { fileName: string },
    author: string | null,
    date: Date
): MediaMessage | null {
    const fileName = attachment.fileName.toLowerCase();
    
    // Extraer extensión
    const ext = fileName.split('.').pop() || '';
    
    // Detectar por prefijo de WhatsApp
    if (fileName.startsWith('img-') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
        return { date, author, type: 'image', fileName: attachment.fileName };
    }
    
    if (fileName.startsWith('vid-') || ['mp4', '3gp', 'avi', 'mov', 'mkv'].includes(ext)) {
        return { date, author, type: 'video', fileName: attachment.fileName };
    }
    
    if (fileName.startsWith('ptt-') || fileName.startsWith('aud-') || ['opus', 'aac', 'm4a', 'mp3', 'ogg', 'wav'].includes(ext)) {
        return { date, author, type: 'audio', fileName: attachment.fileName };
    }
    
    if (fileName.startsWith('stk-') || ext === 'webp') {
        return { date, author, type: 'sticker', fileName: attachment.fileName };
    }
    
    if (ext === 'vcf') {
        return { date, author, type: 'contact', fileName: attachment.fileName };
    }
    
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', '7z'].includes(ext)) {
        return { date, author, type: 'document', fileName: attachment.fileName };
    }
    
    // Si no se puede clasificar, tipo genérico omitted
    return { date, author, type: 'omitted', fileName: attachment.fileName };
}

/**
 * Detecta mensajes de media omitida
 * Categoriza independientemente del OS (iOS/Android) o idioma (EN/ES)
 * 
 * Lógica:
 * - Si detecta tipo específico (ej: "imagen omitida") → type: 'image', fileName: null
 * - Si solo detecta genérico (ej: "<Media omitted>") → type: 'omitted', fileName: null
 * - Si hay attachment real → type: [detectado], fileName: [nombre del archivo]
 */
function detectOmittedMedia(
    content: string, 
    author: string | null, 
    date: Date,
    attachment?: { fileName: string }
): MediaMessage | null {
    // Si termina con "(archivo adjunto)", "(file attached)" o patrón iOS "<adjunto: ...>" / "<attached: ...>"
    if (/\(archivo adjunto\)$/i.test(content) || 
        /\(file attached\)$/i.test(content) ||
        /\u200e?<(adjunto|attached):\s*.+>$/i.test(content)) {
        return { date, author, type: 'omitted', fileName: attachment?.fileName || null };
    }
    
    const patterns = {
        // iOS/Android English - Generic
        media_generic: /<Media omitted>|<Multimedia omitido>|<Archivo omitido>/i,
        
        // Tipos específicos - Spanish
        image_es: /\u200e?imagen omitida/i,
        video_es: /\u200e?video omitido/i,
        audio_es: /\u200e?audio omitido/i,
        sticker_es: /\u200e?sticker omitido/i,
        gif_es: /\u200e?GIF omitido/i,
        document_es: /\u200e?documento omitido/i,
        contact_es: /\u200e?contacto omitido/i,
        
        // Tipos específicos - English
        image_en: /\u200e?image omitted/i,
        video_en: /\u200e?video omitted/i,
        audio_en: /\u200e?audio omitted/i,
        sticker_en: /\u200e?sticker omitted/i,
        gif_en: /\u200e?GIF omitted/i,
        document_en: /\u200e?document omitted/i,
        contact_en: /\u200e?contact omitted/i,
    };
    
    // Intentar detectar tipo específico primero
    if (patterns.image_es.test(content) || patterns.image_en.test(content)) {
        return { date, author, type: 'image', fileName: attachment?.fileName || null };
    }
    if (patterns.video_es.test(content) || patterns.video_en.test(content)) {
        return { date, author, type: 'video', fileName: attachment?.fileName || null };
    }
    if (patterns.audio_es.test(content) || patterns.audio_en.test(content)) {
        return { date, author, type: 'audio', fileName: attachment?.fileName || null };
    }
    if (patterns.sticker_es.test(content) || patterns.sticker_en.test(content)) {
        return { date, author, type: 'sticker', fileName: attachment?.fileName || null };
    }
    if (patterns.gif_es.test(content) || patterns.gif_en.test(content)) {
        return { date, author, type: 'gif', fileName: attachment?.fileName || null };
    }
    if (patterns.document_es.test(content) || patterns.document_en.test(content)) {
        return { date, author, type: 'document', fileName: attachment?.fileName || null };
    }
    if (patterns.contact_es.test(content) || patterns.contact_en.test(content)) {
        return { date, author, type: 'contact', fileName: attachment?.fileName || null };
    }
    
    // Si no encontró tipo específico, buscar genérico
    if (patterns.media_generic.test(content)) {
        return { date, author, type: 'omitted', fileName: attachment?.fileName || null };
    }
    
    return null;
}

// ============================================
// SYSTEM MESSAGE DETECTION FUNCTIONS
// ============================================

function detectEncryption(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^Messages and calls are end-to-end encrypted\./i,
        ANDROID_ES: /^Los mensajes y las llamadas están cifrados de extremo a extremo\./i,
        IOS_EN: /^\u200e?Messages and calls are end-to-end encrypted\./i,
        IOS_ES: /^\u200e?Los mensajes y las llamadas están cifrados de extremo a extremo\./i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectDeleted(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^You deleted this message$/i,
        ANDROID_ES: /^Eliminaste este mensaje\.$/i,
        IOS_EN: /^\u200e?This message was deleted\.$/i,
        IOS_ES: /^\u200e?Se eliminó este mensaje\.$/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectEdited(content: string): boolean {
    const patterns = {
        ANDROID_EN: /Mensaje editado a <This message was edited>/i,
        ANDROID_ES: /Mensaje editado a <Se editó este mensaje\.>/i,
        IOS_EN: /<This message was edited>/i,
        IOS_ES: /<Se editó este mensaje\.>/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

/**
 * Limpia el indicador de edición del contenido de un mensaje
 * Retorna el contenido limpio
 */
function cleanEditedMessage(content: string): string {
    // Remover patrones de edición
    return content
        .replace(/Mensaje editado a <This message was edited>/i, '')
        .replace(/Mensaje editado a <Se editó este mensaje\.>/i, '')
        .replace(/<This message was edited>/i, '')
        .replace(/<Se editó este mensaje\.>/i, '')
        .trim();
}

function detectGroupCreated(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^You created this group$/i,
        ANDROID_ES: /^Creaste este grupo$/i,
        IOS_EN: /created group "(.+)"$/i,
        IOS_ES: /creó el grupo "(.+)"\.$/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectGroupRenamed(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^You changed the group name from "(.+)" to "(.+)"$/i,
        ANDROID_ES: /^Cambiaste el nombre del grupo de "(.+)" a "(.+)"\.$/i,
        IOS_EN: /changed the group name from "(.+)" to "(.+)"$/i,
        IOS_ES: /cambió el nombre del grupo de "(.+)" a "(.+)"\.$/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectUserAdded(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^(You added|were added)/i,
        ANDROID_ES: /^(Añadiste a|Se añadió a)/i,
        IOS_EN: /^\u200e?.+ (added|added you)/i,
        IOS_ES: /^\u200e?.+ (añadió a|te añadió)/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectUserRemoved(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^You removed .+$/i,
        ANDROID_ES: /^Eliminaste a .+\.$/i,
        IOS_EN: /^\u200e?.+ removed .+$/i,
        IOS_ES: /^\u200e?.+ eliminó a .+\.$/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectUserLeft(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^.+ left$/i,
        ANDROID_ES: /^\u200e?.+ salió del grupo\.$/i,
        IOS_EN: /^\u200e?.+ left$/i,
        IOS_ES: /^\u200e?.+ salió del grupo\.$/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectCallMissed(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^Missed voice call\./i,
        ANDROID_ES: /^Llamada perdida\./i,
        IOS_EN: /^\u200e?Missed voice call\./i,
        IOS_ES: /^\u200e?Llamada perdida\./i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectPoll(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^POLL:/i,
        ANDROID_ES: /^ENCUESTA:/i,
        IOS_EN: /^\u200e?POLL:/i,
        IOS_ES: /^\u200e?ENCUESTA:/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectEvent(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^EVENT: /i,
        ANDROID_ES: /^EVENTO: /i,
        IOS_EN: /^\u200e?EVENT: /i,
        IOS_ES: /^\u200e?EVENTO: /i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

function detectLocationShared(content: string): boolean {
    const patterns = {
        ANDROID_EN: /^(live location shared|location: https:\/\/maps\.google\.com)/i,
        ANDROID_ES: /^(ubicación en tiempo real compartida|ubicación: https:\/\/maps\.google\.com)/i,
        IOS_EN: /^\u200e?(Location: https:\/\/maps\.google\.com)/i,
        IOS_ES: /^\u200e?(Ubicación: https:\/\/maps\.google\.com)/i,
    };
    return Object.values(patterns).some(p => p.test(content));
}

/**
 * Detecta y clasifica mensajes del sistema
 * Retorna el tipo de mensaje del sistema detectado, o null si no es un system message
 */
function detectSystemMessage(
    content: string,
    author: string | null,
    date: Date
): SystemMessage | null {
    if (detectEncryption(content)) {
        return { date, author, type: 'encryption', content };
    }
    if (detectGroupCreated(content)) {
        return { date, author, type: 'group_created', content };
    }
    if (detectGroupRenamed(content)) {
        return { date, author, type: 'group_renamed', content };
    }
    if (detectUserAdded(content)) {
        return { date, author, type: 'user_added', content };
    }
    if (detectUserRemoved(content)) {
        return { date, author, type: 'user_removed', content };
    }
    if (detectUserLeft(content)) {
        return { date, author, type: 'user_left', content };
    }
    if (detectCallMissed(content)) {
        return { date, author, type: 'call_missed', content };
    }
    if (detectPoll(content)) {
        return { date, author, type: 'poll', content };
    }
    if (detectEvent(content)) {
        return { date, author, type: 'event', content };
    }
    if (detectLocationShared(content)) {
        return { date, author, type: 'location_shared', content };
    }
    
    // CATCH-ALL: Si el mensaje empieza con U+200E pero no fue detectado,
    // es probablemente un system message que no identificamos
    if (content.startsWith('\u200e')) {
        return { date, author, type: 'undefined', content };
    }
    
    return null;
}

/**
 * Parsea el contenido de un chat de WhatsApp exportado
 * Usa whatsapp-chat-parser como base y aplica filtros adicionales
 */
export function parseWhatsAppChat(chatContent: string): ParsedChatResult {
    // PASO 1: Usar whatsapp-chat-parser para descomponer el chat con attachments
    const rawMessages = parseString(chatContent, { parseAttachments: true });
    
    console.log('\n========================================');
    console.log(`📦 MENSAJES PARSEADOS POR whatsapp-chat-parser (${rawMessages.length} total):`);
    console.log('========================================\n');
    console.table(rawMessages.map((msg, i) => ({
        '#': i + 1,
        date: msg.date?.toISOString() || 'NO DATE',
        author: msg.author || '(sin autor)',
        message: msg.message || '',
        attachment: msg.attachment?.fileName || '-'
    })));
    console.log('========================================\n');
    
    // OPTIMIZACIÓN: Filtrar solo mensajes del 2025
    const messages2025 = rawMessages.filter(msg => {
        if (!msg.date) return false;
        return msg.date.getFullYear() === 2025;
    });
    
    console.log(`🔍 FILTRO: ${rawMessages.length} mensajes → ${messages2025.length} mensajes del 2025\n`);
    
    // PASO 2: Clasificar mensajes en 3 categorías
    const messages: ParsedMessage[] = [];
    const media: MediaMessage[] = [];
    const system: SystemMessage[] = [];
    
    messages2025.forEach(msg => {
        const content = msg.message || '';
        const author = msg.author || null;
        const date = msg.date;
        
        // PRIMER FILTRO: Detectar archivos adjuntos reales
        if (msg.attachment) {
            const attachmentMedia = detectMediaByAttachment(msg.attachment, author, date);
            if (attachmentMedia) {
                media.push(attachmentMedia);
                return;
            }
        }
        
        // Detectar media omitida (sin archivo adjunto)
        const mediaDetected = detectOmittedMedia(content, author, date, msg.attachment);
        if (mediaDetected) {
            media.push(mediaDetected);
            return; // No agregar a messages normales
        }
        
        // Detectar system messages
        const systemDetected = detectSystemMessage(content, author, date);
        if (systemDetected) {
            system.push(systemDetected);
            return;
        }
        
        // CATCH-ALL: Si no tiene autor, whatsapp-chat-parser lo detectó como system message
        // Lo clasificamos como undefined para investigarlo
        if (!author) {
            system.push({ date, author, type: 'undefined', content });
            return;
        }
        
        // CATCH-ALL FINAL: Si contiene U+200E en cualquier parte, probablemente es system message
        if (content.includes('\u200e')) {
            system.push({ date, author, type: 'undefined', content });
            return;
        }
        
        // Detectar mensajes editados y limpiar el contenido
        const isEdited = detectEdited(content);
        const isDeleted = detectDeleted(content);
        
        // Si está editado, limpiar el texto de edición
        // Si está eliminado, dejar contenido vacío
        let cleanContent = content;
        if (isDeleted) {
            cleanContent = '';
        } else if (isEdited) {
            cleanContent = cleanEditedMessage(content);
        }
        
        // Si no es media ni system, es mensaje normal
        messages.push({
            date,
            author,
            content: cleanContent,
            attachment: msg.attachment,
            edited: isEdited || undefined,
            deleted: isDeleted || undefined
        });
    });
    
    console.log('📊 CLASIFICACIÓN:');
    console.log(`   💬 Mensajes normales: ${messages.length}`);
    console.log(`   📸 Media omitida: ${media.length}`);
    console.log(`   ⚙️  System messages: ${system.length}`);
    
    if (media.length > 0) {
        console.log('\n📸 MEDIA DETECTADA:');
        console.table(media.map((m, i) => ({
            '#': i + 1,
            date: m.date.toISOString().split('T')[0],
            author: m.author || '(sin autor)',
            type: m.type,
            fileName: m.fileName || '-'
        })));
    }
    
    if (system.length > 0) {
        console.log('\n⚙️  SYSTEM MESSAGES DETECTADOS:');
        console.table(system.map((s, i) => ({
            '#': i + 1,
            date: s.date.toISOString().split('T')[0],
            author: s.author || '(sin autor)',
            type: s.type,
            content: s.content.substring(0, 50) + (s.content.length > 50 ? '...' : '')
        })));
    }
    
    console.log('\n========================================');
    console.log('📦 RESULTADO FINAL - 3 LISTAS:');
    console.log('========================================');
    
    console.log('\n💬 MESSAGES (mensajes normales):');
    if (messages.length > 0) {
        console.table(messages.slice(0, 10).map((m, i) => ({
            '#': i + 1,
            date: m.date.toISOString().split('T')[0],
            author: m.author || '(sin autor)',
            content: m.content.substring(0, 40) + (m.content.length > 40 ? '...' : ''),
            attachment: m.attachment?.fileName || '-'
        })));
        if (messages.length > 10) {
            console.log(`   ... y ${messages.length - 10} mensajes más`);
        }
    } else {
        console.log('   (vacío)');
    }
    
    console.log('\n📸 MEDIA (media omitida o adjunta):');
    if (media.length > 0) {
        console.table(media.map((m, i) => ({
            '#': i + 1,
            date: m.date.toISOString().split('T')[0],
            author: m.author || '(sin autor)',
            type: m.type,
            fileName: m.fileName || '(omitted)'
        })));
    } else {
        console.log('   (vacío)');
    }
    
    console.log('\n⚙️  SYSTEM (mensajes del sistema):');
    if (system.length > 0) {
        console.table(system.map((s, i) => ({
            '#': i + 1,
            date: s.date.toISOString().split('T')[0],
            author: s.author || '(sin autor)',
            type: s.type,
            preview: s.content.substring(0, 30) + '...'
        })));
    } else {
        console.log('   (vacío)');
    }
    
    console.log('\n========================================');
    console.log(`✅ TOTAL: ${messages.length} mensajes, ${media.length} media, ${system.length} system`);
    console.log('========================================\n');
    
    return { messages, media, system };
}

/**
 * Extrae el nombre del grupo del contenido del chat
 */
export function extractGroupName(chatContent: string): string {
    const match = chatContent.match(/(?:created group|creó el grupo) "(.+)"/i);
    return match ? match[1] : "WhatsApp Group";
}
