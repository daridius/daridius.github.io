import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class OutroSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper outro-slide-content">
            <div class="year-container">
                <h2 class="pre-title">Fue un gran año para</h2>
                <h1 class="group-name">${this.data.group_name}</h1>
                <h2 class="post-title">NOS VEMOS EN 2026</h2>
                <h3 class="story-subtitle">Gracias por compartir tantos momentos este año...</h3>
                
                <div class="actions">
                    <button class="btn-primary share-btn">Compartir este Wrapped</button>
                    <a href="../upload.html" class="btn-secondary">Haz tu propio Wrapped</a>
                </div>
            </div>
            <div class="decorations">
                <span class="bubble b1" style="--d: 1s"></span>
                <span class="bubble b2" style="--d: 2s"></span>
                <span class="bubble b3" style="--d: 0.5s"></span>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        this.timeline = gsap.timeline();

        // Animate Container
        this.timeline.fromTo(
            this.element!.querySelector(".year-container"),
            { scale: 0.9, autoAlpha: 0, y: 30 },
            {
                scale: 1,
                autoAlpha: 1,
                y: 0,
                duration: 1.2,
                ease: "power3.out",
            }
        );

        // Animate Actions (buttons)
        this.timeline.fromTo(
            this.element!.querySelector(".actions"),
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.8 },
            "-=0.6"
        );

        // Animate Bubbles
        this.timeline.fromTo(
            this.element!.querySelectorAll(".bubble"),
            { scale: 0, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, stagger: 0.3, duration: 1, ease: "elastic.out(1, 0.7)" },
            "-=1"
        );

        // Share functionality
        const shareBtn = this.element?.querySelector(".share-btn") as HTMLButtonElement | null;
        if (shareBtn) {
            const storedKeys = sessionStorage.getItem('shareKeys');
            const shareError = sessionStorage.getItem('shareError');

            if (shareError) {
                shareBtn.innerHTML = `❌ No se pudo guardar <span style="font-size: 0.8em; margin-left: 8px;">🔄 Reintentar</span>`;
            } else if (!storedKeys) {
                const urlParams = new URL(window.location.href).searchParams;
                if (!urlParams.get('kv')) {
                    shareBtn.textContent = "⏳ Preparando...";
                    shareBtn.disabled = true;
                    setTimeout(() => {
                        const keysNow = sessionStorage.getItem('shareKeys');
                        if (keysNow) {
                            shareBtn.textContent = "📋 Compartir este Wrapped";
                            shareBtn.disabled = false;
                        } else if (sessionStorage.getItem('shareError')) {
                            shareBtn.innerHTML = `❌ No se pudo guardar <span style="font-size: 0.8em; margin-left: 8px;">🔄 Reintentar</span>`;
                            shareBtn.disabled = false;
                        }
                    }, 2000);
                }
            } else {
                shareBtn.textContent = "📋 Compartir este Wrapped";
            }

            shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation();

                // If there's an error, retry upload instead of redirecting
                if (sessionStorage.getItem('shareError')) {
                    const originalLabel = shareBtn.innerHTML;
                    shareBtn.textContent = "⏳ Reintentando...";
                    shareBtn.disabled = true;

                    try {
                        const { uploadWrappedData } = await import('../services/shareService');
                        await uploadWrappedData(this.data);
                        sessionStorage.removeItem('shareError'); // Clear error on successful retry
                        shareBtn.textContent = "📋 Compartir este Wrapped";
                        shareBtn.disabled = false;
                        // After success, we fall through to the normal sharing logic below
                    } catch (err) {
                        console.error("Retry failed", err);
                        shareBtn.innerHTML = originalLabel;
                        shareBtn.disabled = false;
                        return;
                    }
                }

                let shareUrl = window.location.href;
                const keys = sessionStorage.getItem('shareKeys');

                if (keys) {
                    try {
                        const { kv, enc } = JSON.parse(keys);
                        const url = new URL(window.location.origin + window.location.pathname);
                        url.searchParams.set('kv', kv);
                        url.searchParams.set('enc', enc);
                        shareUrl = url.toString();
                    } catch (e) {
                        console.error("Error parsing shareKeys", e);
                    }
                }

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `Wrapped de ${this.data.group_name}`,
                            text: `¡Mira el resumen del año de nuestro grupo: ${this.data.group_name}!`,
                            url: shareUrl
                        });
                    } catch (err) {
                        console.error("Error sharing:", err);
                    }
                } else {
                    // Fallback to clipboard
                    try {
                        await navigator.clipboard.writeText(shareUrl);
                        const originalText = shareBtn.textContent;
                        shareBtn.textContent = "¡Link Copiado!";
                        setTimeout(() => (shareBtn.textContent = originalText), 2000);
                    } catch (err) {
                        console.error("Clipboard API failed, trying execCommand fallback", err);
                        // Ancient fallback
                        const textArea = document.createElement("textarea");
                        textArea.value = shareUrl;
                        textArea.style.position = "fixed"; // Avoid scrolling to bottom
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                            const successful = document.execCommand('copy');
                            if (successful) {
                                const originalText = shareBtn.textContent;
                                shareBtn.textContent = "¡Link Copiado!";
                                setTimeout(() => (shareBtn.textContent = originalText), 2000);
                            } else {
                                throw new Error('execCommand copy failed');
                            }
                        } catch (err2) {
                            console.error('Final fallback failed', err2);
                            alert("No se pudo copiar automáticamente. Por favor copia este link:\n\n" + shareUrl);
                        }
                        document.body.removeChild(textArea);
                    }
                }
            });
        }
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".year-container, .bubble, .actions");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
