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
        const tl = gsap.timeline();

        // Reveal items
        tl.fromTo(
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

        // Counter animation
        const counters = this.element!.querySelectorAll('.value');
        const values = [
            this.data.totals.messages,
            this.data.totals.words,
            this.data.totals.characters
        ];

        counters.forEach((el, i) => {
            const obj = { val: 0 };
            tl.to(obj, {
                val: values[i],
                duration: 2,
                ease: "power2.out",
                onUpdate: () => {
                    el.textContent = Math.floor(obj.val).toLocaleString();
                }
            }, 0.2 + (i * 0.2)); // Start counting slightly after reveal
        });
    }


    onLeave(): void {
        const elements = this.element?.querySelectorAll(".stat-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
