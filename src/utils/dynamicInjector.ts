import type { WrappedData } from '../data';

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatDate(dStr: string) {
    const d = new Date(dStr);
    const day = d.getUTCDate();
    const month = monthNames[d.getUTCMonth()];
    return `${day} de ${month}`;
}

/**
 * Centrally injects WrappedData into the DOM.
 * Finds all elements with [data-field] or [data-list] and updates them.
 */
export function injectData(data: WrappedData) {
    console.log("Injecting dynamic data...", data);

    // 1. Basic Fields
    const fields = document.querySelectorAll('[data-field]');
    fields.forEach(el => {
        const fieldPath = el.getAttribute('data-field');
        if (!fieldPath) return;

        const value = getNestedValue(data, fieldPath);
        if (value !== undefined && value !== null) {
            const format = el.getAttribute('data-format');

            if (fieldPath.includes('date') || fieldPath.includes('.from') || fieldPath.includes('.to')) {
                const date = new Date(String(value));
                if (format === 'month') {
                    el.textContent = monthNames[date.getUTCMonth()];
                } else if (format === 'day') {
                    el.textContent = String(date.getUTCDate());
                } else if (format === 'year') {
                    el.textContent = String(date.getUTCFullYear());
                } else {
                    el.textContent = formatDate(String(value));
                }
            } else if (typeof value === 'number') {
                el.textContent = value.toLocaleString();
            } else {
                el.textContent = String(value);
            }
        }
    });

    // 2. Specialized Lists
    injectLists(data);

    // Update year specifically
    document.querySelectorAll('[data-year]').forEach(el => {
        el.textContent = String(data.year);
    });

    // 3. Dispatch global ready event in case slides need custom cleanup/logic
    document.dispatchEvent(new CustomEvent('wrapped-data-injected', { detail: data }));
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
}

function injectLists(data: WrappedData) {
    // Top Senders
    const senderLists = document.querySelectorAll('[data-list="top_senders"]');
    senderLists.forEach(list => {
        list.innerHTML = data.top_senders.map((sender, index) => `
        <div class="rank-card rank-${index + 1}" style="opacity: 0;">
            <div class="rank-number">#${index + 1}</div>
            <div class="avatar-placeholder">${sender.name[0]}</div>
            <div class="info">
                <div class="name">${sender.name}</div>
                <div class="count">${sender.messages.toLocaleString()} mensajes</div>
            </div>
            ${index === 0 ? '<div class="crown">👑</div>' : ''}
        </div>
    `).join('');
    });

    // Top Emojis
    const emojiPods = document.querySelectorAll('[data-list="top_emojis"]');
    emojiPods.forEach(pod => {
        const emojis = data.top_emojis || [];
        // Podium Order: 2, 1, 3
        const p2 = emojis[1];
        const p1 = emojis[0];
        const p3 = emojis[2];
        const podium = [p2, p1, p3].filter(Boolean);

        pod.innerHTML = podium.map(item => {
            const rank = emojis.findIndex(e => e.emoji === item.emoji) + 1;
            return `
            <div class="emoji-item rank-${rank}" style="opacity: 0; visibility: hidden;">
                <div class="emoji-char">${item.emoji}</div>
                <div class="emoji-count">${item.count}</div>
            </div>
        `;
        }).join('');
    });

    // Monthly Chart
    const charts = document.querySelectorAll('[data-chart="monthly"]');
    charts.forEach(chart => {
        const entries = Object.entries(data.messages_per_month).map(([k, v]) => [Number(k), v as number]);
        entries.sort((a, b) => a[0] - b[0]);
        const counts = entries.map(e => e[1]);
        const max = Math.max(...counts);

        let peakMonthIdx = 0;
        let peakVal = 0;
        entries.forEach(([m, c]) => { if (c > peakVal) { peakVal = c; peakMonthIdx = m; } });

        chart.innerHTML = entries.map(([m, c]) => {
            const height = (c / max) * 100;
            return `
            <div class="bar-wrapper">
                <div class="bar ${m === peakMonthIdx ? 'peak-bar' : ''}" 
                     style="height: 0%;" 
                     data-height="${height}%"></div>
                <div class="month-label">${monthNames[m - 1].substring(0, 3)}</div>
            </div>
          `;
        }).join('');

        // Also update peak highlights if they exist nearby
        const peakNameEl = document.querySelector('[data-field="peak_month_name"]');
        if (peakNameEl) peakNameEl.textContent = monthNames[peakMonthIdx - 1];
        const peakCountEl = document.querySelector('[data-field="peak_month_count"]');
        if (peakCountEl) peakCountEl.textContent = peakVal.toLocaleString();
    });

    // Top Words
    const wordLists = document.querySelectorAll('[data-list="top_words"]');
    wordLists.forEach(el => {
        el.innerHTML = data.top_words.map((w, index) => `
        <div class="word-pill rank-${index + 1}" style="--scale: ${1 + (5 - index) * 0.2}; opacity: 0; visibility: hidden;">
            <span class="word">${w.word}</span>
            <span class="count-badge">${w.count}</span>
        </div>
      `).join('');
    });
}
