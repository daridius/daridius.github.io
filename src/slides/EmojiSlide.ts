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
        // Order: 2nd, 1st, 3rd (Podium style)
        const top3 = [
            this.data.top_emojis[1],
            this.data.top_emojis[0],
            this.data.top_emojis[2]
        ].filter(Boolean);

        const podiumHtml = top3.map((item) => {
            // Find original rank (0-indexed) to determine class
            const originalIndex = this.data.top_emojis.indexOf(item);
            const rankClass = `rank-${originalIndex + 1}`;

            return `
                <div class="emoji-item ${rankClass}">
                    <div class="emoji-char">${item.emoji}</div>
                    <div class="emoji-count">${item.count}</div>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper emoji-slide-content">
            <div class="intro">
                <h2>Y emojis que no dejaron de aparecer...</h2>
            </div>
            <div class="emoji-podium">
                ${podiumHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const intro = this.element?.querySelector(".intro");
        const items = this.element?.querySelectorAll(".emoji-item");

        if (intro) {
            gsap.fromTo(
                intro,
                { autoAlpha: 0, scale: 0.8 },
                { autoAlpha: 1, scale: 1, duration: 1 }
            );
        }

        if (items && items.length > 0) {
            gsap.fromTo(
                items,
                { y: 100, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    stagger: 0.2,
                    duration: 0.8,
                    ease: "back.out(2)",
                    delay: 0.3,
                }
            );
        }
    }

    onLeave(): void {
        const elements = this.element?.querySelectorAll(".intro, .emoji-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
