import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class EmojiSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const topEmojis = this.data.top_emojis?.slice(0, 5) || [];
        if (topEmojis.length === 0) return '';

        const maxCount = topEmojis[0]?.count || 1;

        // Spread positions to create an organic cloud
        const positions = [
            { top: '45%', left: '50%' },
            { top: '22%', left: '30%' },
            { top: '72%', left: '28%' },
            { top: '28%', left: '72%' },
            { top: '75%', left: '75%' }
        ];

        const bubblesHtml = topEmojis.map((item, i) => {
            const baseSize = 150;
            const minSize = 100;
            const relativeScale = Math.sqrt(item.count / maxCount);
            const size = Math.max(minSize, baseSize * relativeScale);
            const pos = positions[i];

            return `
                <div class="member-bubble rank-${i + 1}" 
                    style="width: ${size}px; height: ${size}px; top: ${pos.top}; left: ${pos.left}; transform: translate(-50%, -50%)">
                    <div class="b-name" style="font-size: 2.5rem; margin-bottom: 5px;">${item.emoji}</div>
                    <div class="b-count">${item.count}</div>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper emoji-slide-content">
            <h2 class="title">Tus reacciones favoritas...</h2>
            <div class="bubble-ranking-container">
                ${bubblesHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".title");
        const bubbles = this.element?.querySelectorAll(".member-bubble");

        if (title) {
            this.tweens.push(gsap.fromTo(title, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.8 }));
        }

        if (bubbles && bubbles.length > 0) {
            this.tweens.push(gsap.fromTo(bubbles,
                { autoAlpha: 0, scale: 0, rotate: -45 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    rotate: 0,
                    stagger: 0.15,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.7)",
                    onComplete: () => {
                        bubbles.forEach((el, idx) => {
                            (el as HTMLElement).classList.add('floating');
                            (el as HTMLElement).style.animationDelay = `${idx * 0.4}s`;
                        });
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
