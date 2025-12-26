import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class StickerPeopleSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const list = this.data.top_sticker_senders?.slice(0, 1) || [];
        if (list.length === 0) return '';

        const winner = list[0];
        const name = this.data.participants[winner.nameIndex];

        // Center position for single sticker
        const stickerHtml = `
            <div class="member-bubble rank-1" 
                style="width: 200px; height: 200px; top: 50%; left: 50%; transform: translate(-50%, -50%)">
                <img src="data:image/webp;base64,${winner.sticker}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));" />
            </div>
        `;

        return `
        <div class="content-wrapper sticker-people-slide-content">
            <style>
                .sticker-people-slide-content .member-bubble {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                }
                .sticker-people-slide-content .member-bubble::after {
                    display: none !important;
                }
            </style>
            <h2 class="title">Aunque algunos se pasaron... ¡${name} mandó este ${winner.count} veces!</h2>
            <div class="bubble-ranking-container">
                ${stickerHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".title");
        const bubble = this.element?.querySelector(".member-bubble");

        if (title) {
            this.tweens.push(gsap.fromTo(title, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.8 }));
        }

        if (bubble) {
            this.tweens.push(gsap.fromTo(bubble,
                { autoAlpha: 0, scale: 0, rotate: -45 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    rotate: 0,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.7)",
                    onComplete: () => {
                        (bubble as HTMLElement).classList.add('floating');
                    }
                }
            ));
        }
    }

    onLeave(): void {
        this.killAnimations();
        const els = this.element?.querySelectorAll(".title, .member-bubble");
        if (els) gsap.set(els, { autoAlpha: 0 });
    }
}

