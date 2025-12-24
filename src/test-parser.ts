import JSZip from "jszip";
import { parseWhatsAppChat } from "./utils/messageParser";

console.log("🔍 Test Parser Initialized");

function setStatus(msg: string, type: "visible" | "error" | "process") {
    const statusEl = document.getElementById("status");
    console.log(`[Status] ${type}: ${msg}`);
    if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = `status visible ${type}`;
    }
}

function formatDate(date: Date): string {
    return date.toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderMessages(messages: any[]) {
    const container = document.getElementById("messages-content");
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay mensajes normales</div>';
        return;
    }

    const displayCount = 50;
    const toShow = messages.slice(0, displayCount);
    const remaining = messages.length - displayCount;

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Autor</th>
                <th>Contenido</th>
                <th>Attachment</th>
            </tr>
        </thead>
        <tbody>
            ${toShow.map((m, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(m.date)}</td>
                    <td>${m.author || '(sin autor)'}</td>
                    <td>${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}</td>
                    <td>${m.attachment?.fileName || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);

    if (remaining > 0) {
        const showMore = document.createElement('div');
        showMore.className = 'show-more';
        showMore.textContent = `... y ${remaining} mensajes más`;
        container.appendChild(showMore);
    }
}

function renderMedia(media: any[]) {
    const container = document.getElementById("media-content");
    if (!container) return;

    if (media.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay media detectada</div>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Autor</th>
                <th>Tipo</th>
                <th>Archivo</th>
            </tr>
        </thead>
        <tbody>
            ${media.map((m, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(m.date)}</td>
                    <td>${m.author || '(sin autor)'}</td>
                    <td><span class="type-badge type-${m.type}">${m.type}</span></td>
                    <td>${m.fileName || '(omitted)'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

function renderSystem(system: any[]) {
    const container = document.getElementById("system-content");
    if (!container) return;

    if (system.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay mensajes del sistema</div>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Autor</th>
                <th>Tipo</th>
                <th>Contenido</th>
            </tr>
        </thead>
        <tbody>
            ${system.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${formatDate(s.date)}</td>
                    <td>${s.author || '(sin autor)'}</td>
                    <td><span class="type-badge system-${s.type}">${s.type}</span></td>
                    <td>${s.content.substring(0, 80)}${s.content.length > 80 ? '...' : ''}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

async function processFile(file: File) {
    console.log("⚙️ Processing:", file.name);
    setStatus("Procesando archivo...", "process");

    try {
        let text = "";

        // Detectar y procesar ZIP igual que upload.ts
        if (file.name.endsWith(".zip")) {
            console.log("📦 ZIP detectado, descomprimiendo...");
            const zip = new JSZip();
            const loaded = await zip.loadAsync(file);
            console.log("📦 Contenido del ZIP:", Object.keys(loaded.files));

            const chatFile = Object.values(loaded.files).find(
                (f) => f.name.includes("_chat.txt") || f.name.endsWith(".txt")
            );

            if (!chatFile) {
                throw new Error("No se encontró archivo .txt en el ZIP");
            }

            text = await chatFile.async("string");
            console.log("✅ Archivo .txt extraído del ZIP");
        } else {
            text = await file.text();
            console.log("✅ Archivo .txt leído");
        }

        console.log("📝 Longitud del texto:", text.length);
        setStatus("Analizando mensajes...", "process");

        // Parsear con la nueva arquitectura
        console.log('\n🚀 COMENZANDO ANÁLISIS...');
        const result = parseWhatsAppChat(text);
        console.log('✅ ANÁLISIS COMPLETADO\n');

        // Actualizar contadores
        document.getElementById("count-messages")!.textContent = result.messages.length.toString();
        document.getElementById("count-media")!.textContent = result.media.length.toString();
        document.getElementById("count-system")!.textContent = result.system.length.toString();

        // Renderizar tablas
        renderMessages(result.messages);
        renderMedia(result.media);
        renderSystem(result.system);

        // Mostrar resultados
        document.getElementById("results")!.classList.add("visible");
        
        // Ocultar status
        const statusEl = document.getElementById("status");
        if (statusEl) {
            statusEl.style.display = 'none';
        }

    } catch (err) {
        console.error("❌ Error:", err);
        setStatus(err instanceof Error ? err.message : "Error procesando archivo", "error");
    }
}

// Setup drag & drop y file input
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input") as HTMLInputElement;

uploadZone?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) processFile(file);
});

uploadZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
});

uploadZone?.addEventListener("dragleave", () => {
    uploadZone.classList.remove("dragover");
});

uploadZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
});
