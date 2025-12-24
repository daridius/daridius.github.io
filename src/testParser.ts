import { parseWhatsAppChat } from './utils/messageParser';

// Elements
const uploadZone = document.getElementById('uploadZone')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const loading = document.getElementById('loading')!;
const results = document.getElementById('results')!;

const messagesCount = document.getElementById('messagesCount')!;
const mediaCount = document.getElementById('mediaCount')!;
const systemCount = document.getElementById('systemCount')!;

const messagesTable = document.getElementById('messagesTable')!;
const mediaTable = document.getElementById('mediaTable')!;
const systemTable = document.getElementById('systemTable')!;

// Upload zone click
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        await handleFile(file);
    }
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const file = e.dataTransfer?.files[0];
    if (file) {
        await handleFile(file);
    }
});

async function handleFile(file: File) {
    try {
        // Show loading
        loading.classList.add('active');
        results.classList.remove('active');
        
        // Read file
        const content = await file.text();
        
        // Parse chat
        console.log('🚀 Iniciando parsing...');
        const result = parseWhatsAppChat(content);
        console.log('✅ Parsing completado:', result);
        
        // Update stats
        messagesCount.textContent = result.messages.length.toString();
        mediaCount.textContent = result.media.length.toString();
        systemCount.textContent = result.system.length.toString();
        
        // Render tables
        renderMessagesTable(result.messages);
        renderMediaTable(result.media);
        renderSystemTable(result.system);
        
        // Show results
        loading.classList.remove('active');
        results.classList.add('active');
        
    } catch (error) {
        console.error('Error parseando archivo:', error);
        alert('Error parseando el archivo. Ver consola para detalles.');
        loading.classList.remove('active');
    }
}

function renderMessagesTable(messages: any[]) {
    if (messages.length === 0) {
        messagesTable.innerHTML = '<div class="empty-state">No hay mensajes normales</div>';
        return;
    }
    
    const rows = messages.slice(0, 50).map((m, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${formatDate(m.date)}</td>
            <td><strong>${m.author || '(sin autor)'}</strong></td>
            <td>${escapeHtml(m.content.substring(0, 100))}${m.content.length > 100 ? '...' : ''}</td>
            <td>${m.attachment ? `📎 ${m.attachment.fileName}` : '-'}</td>
        </tr>
    `).join('');
    
    messagesTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Fecha</th>
                    <th>Autor</th>
                    <th>Contenido</th>
                    <th>Adjunto</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        ${messages.length > 50 ? `<p style="text-align: center; margin-top: 15px; color: #666;">... y ${messages.length - 50} mensajes más</p>` : ''}
    `;
}

function renderMediaTable(media: any[]) {
    if (media.length === 0) {
        mediaTable.innerHTML = '<div class="empty-state">No hay media detectada</div>';
        return;
    }
    
    const rows = media.map((m, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${formatDate(m.date)}</td>
            <td><strong>${m.author || '(sin autor)'}</strong></td>
            <td><span class="type-badge type-${m.type}">${m.type}</span></td>
            <td>${m.fileName || '<em>(omitido)</em>'}</td>
        </tr>
    `).join('');
    
    mediaTable.innerHTML = `
        <table>
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
                ${rows}
            </tbody>
        </table>
    `;
}

function renderSystemTable(system: any[]) {
    if (system.length === 0) {
        systemTable.innerHTML = '<div class="empty-state">No hay system messages</div>';
        return;
    }
    
    const rows = system.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${formatDate(s.date)}</td>
            <td><strong>${s.author || '(sin autor)'}</strong></td>
            <td><span class="type-badge type-${s.type}">${s.type}</span></td>
            <td>${escapeHtml(s.content.substring(0, 80))}${s.content.length > 80 ? '...' : ''}</td>
        </tr>
    `).join('');
    
    systemTable.innerHTML = `
        <table>
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
                ${rows}
            </tbody>
        </table>
    `;
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
