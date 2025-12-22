import JSZip from "jszip";
import { parseChat } from "./utils/chatParser";
import { compressAndEncode } from "./utils/compression";

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
    setStatus("Unpacking your story...", "process");

    try {
        let text = "";
        await new Promise((r) => setTimeout(r, 600));

        if (file.name.endsWith(".zip")) {
            console.log("📦 ZIP detected, unzipping...");
            const zip = new JSZip();
            const loaded = await zip.loadAsync(file);
            console.log("📦 ZIP Content:", Object.keys(loaded.files));

            const chatFile = Object.values(loaded.files).find(
                (f) => f.name.includes("_chat.txt") || f.name.endsWith(".txt")
            );

            if (!chatFile) throw new Error("No chat file (.txt) found in ZIP.");
            text = await chatFile.async("string");
        } else {
            text = await file.text();
        }

        console.log("📝 Text recovered, length:", text.length);
        setStatus("Analyzing messages...", "process");
        await new Promise((r) => setTimeout(r, 400));

        const data = parseChat(text);
        console.log("✅ Chat parsed successfully:", data);

        showNamesEditor(data);

    } catch (err) {
        console.error("❌ Error processing file:", err);
        setStatus(err instanceof Error ? err.message : "Something went wrong.", "error");
    }
}

function showNamesEditor(data: any) {
    setStatus("Customize names", "visible");
    const card = document.querySelector(".upload-card");
    if (!card) return;

    // We want to edit: Group Name and Top Senders
    const senders = data.top_senders;

    let sendersHtml = senders.map((s: any, i: number) => `
        <div class="name-input-group">
            <label>Sender #${i + 1} (${s.messages} msgs)</label>
            <input type="text" class="sender-name-input" data-index="${i}" value="${s.name}">
        </div>
    `).join('');

    card.innerHTML = `
        <div class="names-editor">
            <h2>Corregir nombres</h2>
            <p>A veces los nombres vienen con "grupo de trabajo" o extras. ¡Déjalos bonitos!</p>
            
            <div class="names-list">
                <div class="name-input-group">
                    <label>Nombre del Grupo</label>
                    <input type="text" id="group-name-input" value="${data.group_name}">
                </div>
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0;">
                ${sendersHtml}
            </div>

            <div class="editor-footer">
                <button id="generate-btn" class="btn-primary">Generar mi Wrapped</button>
            </div>
        </div>
    `;

    document.getElementById("generate-btn")?.addEventListener("click", () => {
        // Update Data
        const groupInput = document.getElementById("group-name-input") as HTMLInputElement;
        data.group_name = groupInput.value;

        const senderInputs = document.querySelectorAll(".sender-name-input") as NodeListOf<HTMLInputElement>;
        senderInputs.forEach(input => {
            const idx = parseInt(input.getAttribute("data-index") || "0");
            const oldName = data.top_senders[idx].name;
            const newName = input.value;

            // Update in top_senders
            data.top_senders[idx].name = newName;

            // Also update in most_frequent_message if it's the same person
            if (data.most_frequent_message.author === oldName) {
                data.most_frequent_message.author = newName;
            }
        });

        generateFinalWrapped(data);
    });
}

function generateFinalWrapped(data: any) {
    setStatus("Generating your story...", "process");

    // Slight delay for effect
    setTimeout(() => {
        const hash = compressAndEncode(data);
        const shareUrl = `${window.location.origin}/#${hash}`;

        setStatus("Wrapped Ready!", "success");
        const card = document.querySelector(".upload-card");

        if (card) {
            card.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="width: 60px; height: 60px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <svg width="32" height="32" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px;">¡Análisis Completo!</h2>
                    <p style="color: #8696a0; margin-bottom: 32px; font-weight: 300;">Tu historia de 2025 está lista.</p>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
                        <a href="/#${hash}" class="btn-primary" style="display: block; background: #25D366; color: #0b141a; font-weight: 700; padding: 16px; border-radius: 16px; text-decoration: none; font-size: 16px;">
                            Ver Mi Wrapped
                        </a>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                        <p style="font-size: 11px; text-transform: uppercase; color: #8696a0; letter-spacing: 1px; margin-bottom: 8px; text-align: left;">Link para compartir</p>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="text" id="share-link-input" value="${shareUrl}" readonly style="flex: 1; background: transparent; border: none; color: #fff; font-family: monospace; font-size: 13px; outline: none;">
                            <button id="copy-btn" style="background: rgba(37, 211, 102, 0.1); border: none; color: #25D366; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px;">COPIAR</button>
                        </div>
                    </div>
                </div>`;
        }
    }, 800);
}

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
