import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class TotalsSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper totals-slide-content">
            <div class="stat-container">
                <div class="stat-item s1">
                    <h2 class="label">Mensajes</h2>
                    <div class="value big">${this.data.totals.messages.toLocaleString()}</div>
                </div>

                <div class="stat-item s2">
                    <h2 class="label">Palabras</h2>
                    <div class="value medium">${this.data.totals.words.toLocaleString()}</div>
                </div>

                <div class="stat-item s3">
                    <h2 class="label">Caracteres</h2>
                    <div class="value small">${this.data.totals.characters.toLocaleString()}</div>
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        this.timeline = gsap.timeline();

        // Reveal items
        this.timeline.fromTo(
            this.element!.querySelectorAll(".stat-item"),
            { autoAlpha: 0, scale: 0.8, y: 30 },
            {
                autoAlpha: 1,
                scale: 1,
                y: 0,
                stagger: 0.3,
                duration: 1,
                ease: "power4.out"
            }
        );

        // Counter Animation
        const msgEl = this.element!.querySelector("#stat-messages");
        const wordsEl = this.element!.querySelector("#stat-words");
        const charsEl = this.element!.querySelector("#stat-chars");

        const obj = { m: 0, w: 0, c: 0 };
        this.timeline.to(obj, {
            m: this.data.totals.messages,
            w: this.data.totals.words,
            c: this.data.totals.characters,
            duration: 2.5,
            ease: "expo.out",
            onUpdate: () => {
                if (msgEl) msgEl.textContent = Math.floor(obj.m).toLocaleString();
                if (wordsEl) wordsEl.textContent = Math.floor(obj.w).toLocaleString();
                if (charsEl) charsEl.textContent = Math.floor(obj.c).toLocaleString();
            }
        }, "-=0.8");
    }


    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".stat-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
