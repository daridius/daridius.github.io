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
            // Use font-size instead of scale to respect layout flow and avoid overlaps
            const fontSize = 1 + (5 - index) * 0.12;

            return `
                <div class="word-pill ${rankClass}" style="font-size: ${fontSize}rem">
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
                    scale: 1,
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
