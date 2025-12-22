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
                    <div id="stat-messages" class="value big">${this.data.totals.messages.toLocaleString()}</div>
                </div>

                <div class="stat-item s2">
                    <h2 class="label">Palabras</h2>
                    <div id="stat-words" class="value medium">${this.data.totals.words.toLocaleString()}</div>
                </div>

                <div class="stat-item s3">
                    <h2 class="label">Caracteres</h2>
                    <div id="stat-chars" class="value small">${this.data.totals.characters.toLocaleString()}</div>
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        this.timeline = gsap.timeline();
        const items = this.element?.querySelectorAll(".stat-item");

        if (!items) return;

        const targetValues = [
            this.data.totals.messages,
            this.data.totals.words,
            this.data.totals.characters
        ];

        items.forEach((item, i) => {
            const valEl = item.querySelector('.value');
            if (!valEl) return;

            // Reset to 0 before showing
            valEl.textContent = "0";

            // 1. Reveal item
            this.timeline!.fromTo(
                item,
                { autoAlpha: 0, scale: 0.8, y: 30 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power4.out"
                },
                i * 0.3 // Manual stagger
            );

            // 2. Animate counter starting slightly after the item starts appearing
            const obj = { val: 0 };
            this.timeline!.to(obj, {
                val: targetValues[i],
                duration: 2,
                ease: "expo.out",
                onUpdate: () => {
                    valEl.textContent = Math.floor(obj.val).toLocaleString();
                }
            }, i * 0.3 + 0.2);
        });
    }


    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".stat-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
