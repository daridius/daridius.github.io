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
            gsap.fromTo(
                title,
                { autoAlpha: 0, y: -20 },
                { autoAlpha: 1, y: 0, duration: 1 }
            );
        }

        if (pills && pills.length > 0) {
            gsap.fromTo(
                pills,
                { scale: 0.5, autoAlpha: 0 },
                {
                    scale: 1,
                    autoAlpha: 1,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: "back.out(1.5)",
                    delay: 0.3,
                }
            );
        }
    }

    onLeave(): void { }
}
