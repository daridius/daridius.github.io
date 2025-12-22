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
                    <a href="/" class="btn-secondary">Haz tu propio Wrapped</a>
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
        const shareBtn = this.element?.querySelector(".share-btn");
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({
                        title: `Wrapped de ${this.data.group_name}`,
                        text: `¡Mira el resumen del año de nuestro grupo: ${this.data.group_name}!`,
                        url: url
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(url).then(() => {
                        const originalText = shareBtn.textContent;
                        shareBtn.textContent = "¡Copiado!";
                        setTimeout(() => {
                            shareBtn.textContent = originalText;
                        }, 2000);
                    });
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
