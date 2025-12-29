import './style.css';
import JSZip from "jszip";
import { parseWhatsAppChat, extractGroupName } from "./utils/messageParser";
import { calculateStats } from "./utils/statsCalculator";

console.log("🚀 Upload Script Initialized");

function getStatusEl(): HTMLElement | null {
    return document.getElementById("status");
}

function setStatus(msg: string, type: "visible" | "success" | "error" | "process") {
    const statusEl = getStatusEl();
    console.log(`[Status Update] ${type}: ${msg}`);
    if (statusEl) {
        statusEl.textContent = msg;
        statusEl.className = `status visible ${type}`;
    }
}

async function processFile(file: File) {
    console.log("⚙️ Starting processing for:", file.name);
    setStatus("Desempacando tu historia...", "process");

    try {
        let text = "";
        let loadedZip: JSZip | null = null;

        await new Promise((r) => setTimeout(r, 600));

        if (file.name.endsWith(".zip")) {
            console.log("📦 ZIP detected, unzipping...");
            const zip = new JSZip();
            loadedZip = await zip.loadAsync(file);
            console.log("📦 ZIP Content:", Object.keys(loadedZip.files));

            const chatFile = Object.values(loadedZip.files).find(
                (f) => f.name.includes("_chat.txt") || f.name.endsWith(".txt")
            );

            if (!chatFile) throw new Error("No chat file (.txt) found in ZIP.");
            text = await chatFile.async("string");
        } else {
            text = await file.text();
        }

        console.log("📝 Text recovered, length:", text.length);
        setStatus("Analizando mensajes...", "process");
        await new Promise((r) => setTimeout(r, 400));

        // Fase 1: Parsear mensajes con whatsapp-chat-parser
        console.log('\n🚀 COMENZANDO ANÁLISIS DEL CHAT...');
        const result = parseWhatsAppChat(text);
        const groupName = extractGroupName(text);

        // Fase 2: Calcular estadísticas (sin imágenes aún)
        console.log('\n📊 CALCULANDO ESTADÍSTICAS...');
        const data = calculateStats(result, groupName);

        // Fase 3: Extraer SOLO los stickers necesarios del ZIP
        if (loadedZip) {
            console.log("📦 Extracting specific stickers...");
            const files = loadedZip.files;

            // Helper para buscar y extraer archivo
            const extractFile = async (fileName: string) => {
                // Buscar archivo que termine con el nombre (para manejar carpetas dentro del zip)
                const fileInZip = Object.values(files).find(f => f.name.endsWith(fileName) && !f.name.startsWith("__MACOSX"));
                if (fileInZip) {
                    return await fileInZip.async("base64");
                }
                return null;
            };

            // 1. Top Stickers
            if (data.top_stickers) {
                const validStickers = [];
                for (const item of data.top_stickers) {
                    // item.content tiene el nombre del archivo temporalmente
                    const fileName = item.content;
                    if (fileName && fileName !== 'unknown') {
                        const base64 = await extractFile(fileName);
                        if (base64) {
                            item.content = base64;
                            validStickers.push(item);
                        } else {
                            console.warn(`⚠️ Sticker file not found in ZIP: ${fileName} `);
                        }
                    }
                }
                // Actualizar la lista solo con los que se encontraron
                data.top_stickers = validStickers;

                // Si no quedó ninguno, eliminar la categoría para que no salga la slide
                if (data.top_stickers.length === 0) {
                    delete data.top_stickers;
                }
            }

            // 2. Top Sticker Senders
            if (data.top_sticker_senders) {
                const validSenders = [];
                for (const item of data.top_sticker_senders) {
                    // item.sticker tiene el nombre del archivo temporalmente
                    const fileName = item.sticker;
                    if (fileName && fileName !== 'unknown') {
                        const base64 = await extractFile(fileName);
                        if (base64) {
                            item.sticker = base64;
                            validSenders.push(item);
                        } else {
                            console.warn(`⚠️ Sticker file not found in ZIP: ${fileName} `);
                        }
                    }
                }
                // Actualizar la lista solo con los que se encontraron
                data.top_sticker_senders = validSenders;

                // Si no quedó ninguno, eliminar la categoría para que no salga la slide
                if (data.top_sticker_senders.length === 0) {
                    delete data.top_sticker_senders;
                }
            }
            console.log("📦 Sticker extraction complete");
        } else {
            // Si no hay ZIP (solo txt), no tenemos las imágenes de los stickers.
            // Eliminamos estas categorías para evitar slides con imágenes rotas.
            console.log("⚠️ No ZIP loaded. Removing media-dependent categories (stickers).");
            delete data.top_stickers;
            delete data.top_sticker_senders;
        }

        console.log('\n✅ ANÁLISIS COMPLETADO');
        console.log(`   Año: ${data.year} `);
        console.log(`   Grupo: ${data.group_name} `);
        if (data.totals) {
            console.log(`   Mensajes: ${data.totals.messages} `);
        }
        console.log("✅ Chat parsed successfully:", data);

        showNamesEditor(data);

    } catch (err) {
        console.error("❌ Error processing file:", err);
        setStatus(err instanceof Error ? err.message : "Algo salió mal.", "error");
    }
}

function showNamesEditor(data: any) {
    setStatus("Personaliza nombres", "visible");
    const modalContent = document.querySelector(".modal-content");
    const modal = document.getElementById("upload-modal");
    if (!modalContent || !modal) return;

    // Scroll to top of modal
    modal.scrollTo(0, 0);

    // Editamos el array de participants directamente
    const participants = data.participants;

    let participantsHtml = participants.map((name: string, i: number) => `
        <div class="name-input-group">
            <input type="text" class="participant-name-input" data-index="${i}" value="${name}">
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Personaliza nombres</h2>
            <button id="close-modal-btn" class="close-modal-btn">&times;</button>
        </div>
        <div class="names-editor" style="background: none; padding: 0;">
            <p>Aquí aparecen los "nominados" a salir en tu historia. ¡Dales un nombre bonito!</p>
            <p style="font-size: 0.8em; margin-top: -15px; opacity: 0.8;">(No aparecen todos los del chat, solo los que tuvieron más protagonismo este año)</p>
            
            <div class="names-list">
                <div class="name-input-group">
                    <label>Nombre del Grupo</label>
                    <input type="text" id="group-name-input" value="${data.group_name}">
                </div>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0;">
                <div class="name-input-group" style="margin-bottom: -8px;">
                    <label>NOMINADOS AL WRAPPED</label>
                </div>
                ${participantsHtml}
            </div>

            <div class="editor-footer">
                <button id="generate-btn" class="btn-primary">Ver mi Wrapped</button>
            </div>
        </div>
    `;

    // Re-bind listeners for the new elements
    document.getElementById("close-modal-btn")?.addEventListener("click", closeModal);

    document.getElementById("generate-btn")?.addEventListener("click", () => {
        // Update Data
        const groupInput = document.getElementById("group-name-input") as HTMLInputElement;
        data.group_name = groupInput.value;

        const participantInputs = document.querySelectorAll(".participant-name-input") as NodeListOf<HTMLInputElement>;
        participantInputs.forEach(input => {
            const idx = parseInt(input.getAttribute("data-index") || "0");
            data.participants[idx] = input.value;
        });

        generateFinalWrapped(data);
    });
}

async function generateFinalWrapped(data: any) {
    setStatus("Generando tu historia...", "process");

    // Limpiar errores previos de esta sesión
    sessionStorage.removeItem('shareError');
    sessionStorage.removeItem('shareKeys');

    // Guardar en sessionStorage para visualización inmediata
    console.log('💾 Guardando wrapped data en sessionStorage...');
    sessionStorage.setItem('wrappedData', JSON.stringify(data));

    // Proceso de subida a KV - Ahora esperamos a que termine
    try {
        const { uploadWrappedData } = await import('./services/shareService');
        await uploadWrappedData(data);
        console.log('✅ Subida a KV completada con éxito.');
    } catch (err) {
        console.warn('⚠️ No se pudo habilitar el compartir (vía KV):', err);
        sessionStorage.setItem('shareError', 'true');
    }

    // Un pequeño delay para que el usuario vea el mensaje de éxito si fue muy rápido
    setStatus("¡Wrapped listo!", "success");
    await new Promise(r => setTimeout(r, 800));

    console.log('✅ Redirigiendo a visualización...');
    window.location.href = './wrapped/';
}

// --- Modal Logic ---
const modal = document.getElementById("upload-modal");
const openBtn = document.getElementById("open-upload-btn");
const closeBtn = document.getElementById("close-modal-btn");

function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
    // Esperar a que termine la transición (0.3s) antes de ocultar
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
}

if (modal && openBtn && closeBtn) {
    openBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        // Pequeño delay para permitir que el navegador renderice el display:flex
        // antes de aplicar la clase active para la transición
        requestAnimationFrame(() => {
            modal.classList.add("active");
        });
    });

    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Auto-open modal if ?open=true is in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open') === 'true') {
        openBtn.click();
    }
}

// --- Tabs Logic ---
const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".instructions-content");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove("active"));
        // Add to clicked
        tab.classList.add("active");

        const targetId = (tab as HTMLElement).dataset.tab; // android or ios

        // Hide all contents
        contents.forEach(c => c.classList.add("hidden"));

        // Show target
        const targetContent = document.getElementById(`tab-${targetId}`);
        if (targetContent) {
            targetContent.classList.remove("hidden");
        }
    });
});


// Global Event Delegation
document.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target && target.id === "file-upload" && target.files && target.files.length) {
        processFile(target.files[0]);
    }
});

document.addEventListener("dragover", (e) => {
    const target = e.target as HTMLElement;
    const dropZone = target.closest("#drop-zone");
    if (dropZone) {
        e.preventDefault();
        dropZone.classList.add("drag-active");
    }
});

document.addEventListener("dragleave", (e) => {
    const target = e.target as HTMLElement;
    const dropZone = target.closest("#drop-zone");
    if (dropZone) {
        e.preventDefault();
        dropZone.classList.remove("drag-active");
    }
});

document.addEventListener("drop", (e) => {
    const target = e.target as HTMLElement;
    const dropZone = target.closest("#drop-zone");
    if (dropZone) {
        e.preventDefault();
        dropZone.classList.remove("drag-active");

        if (e.dataTransfer && e.dataTransfer.files.length) {
            processFile(e.dataTransfer.files[0]);
        }
    }
});

document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target && target.id === "copy-btn") {
        const input = document.getElementById("share-link-input") as HTMLInputElement;
        if (input) {
            input.select();
            navigator.clipboard.writeText(input.value);
            target.textContent = "COPIADO!";
            setTimeout(() => (target.textContent = "COPIAR"), 2000);
        }
    }
});
