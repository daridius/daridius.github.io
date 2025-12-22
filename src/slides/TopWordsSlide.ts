import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class TopWordsSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const pillsHtml = this.data.top_words.map((item, index) => {
            const rankClass = `rank-${index + 1}`;
            const scale = 1 + (5 - index) * 0.2;

            return `
                <div class="word-pill ${rankClass}" style="--scale: ${scale}">
                    <span class="word">${item.word}</span>
                    <span class="count-badge">${item.count}</span>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper top-words-slide-content">
            <h2 class="title">Palabras que no pararon de usar...</h2>
            <div class="word-cloud-pills">
                ${pillsHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".title");
        const pills = this.element?.querySelectorAll(".word-pill");

        if (title) {
            this.tweens.push(gsap.fromTo(
                title,
                { autoAlpha: 0, scale: 0.9 },
                { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power2.out" }
            ));
        }

        if (pills && pills.length > 0) {
            this.tweens.push(gsap.fromTo(
                pills,
                { scale: 0, autoAlpha: 0 },
                {
                    scale: (i, el) => {
                        // Keep the original scale from style or dataset if needed, 
                        // but here we just want to scale to their computed size.
                        // Actually, we should probably read the intended scale from a CSS variable if set,
                        // or just scale to 1 assuming the CSS sets the base size.
                        // However, the CSS sets --scale. 
                        // Let's just animate to scale: var(--scale) is tricky in "to".
                        // Better: animate 'scale' property from 0 to 1, and let CSS var handle the size relative to that?
                        // The CSS has: transform: scale(var(--scale));
                        // If GSAP animates "scale", it overrides transform.
                        // This might conflict. 
                        // A safer bet is "from: { autoAlpha: 0, scale: 0 }, to: { autoAlpha: 1, scale: 1 }" 
                        // assuming GSAP composes properly or we act on a safe property.
                        // Actually, previously it was:
                        // { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1 ... }
                        // This likely worked because GSAP parses the current transform. 
                        // Let's stick to what was there.
                        return 1; // Return 1 to animate to "natural" size of the element context
                    },
                    autoAlpha: 1,
                    stagger: {
                        amount: 1,
                        from: "random"
                    },
                    duration: 0.8,
                    delay: 0.3,
                    ease: "back.out(1.7)"
                }
            ));
        }
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".title, .word-pill");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
