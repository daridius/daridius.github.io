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
        gsap.fromTo(
            this.element!.querySelectorAll(".stat-item"),
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, stagger: 0.2, duration: 0.8, ease: "back.out" }
        );
    }

    onLeave(): void {
        // Cleanup
    }
}
