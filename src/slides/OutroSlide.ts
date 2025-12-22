import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class OutroSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper outro-slide-content">
             <div class="content">
                <h1>
                    ¡Qué gran año para el grupo <span>${this.data.group_name}</span>!
                </h1>
                <div class="emoji">🥳</div>
                <p>Nos vemos en 2026 con más historias.</p>

                <div class="actions" style="margin-top: 40px;">
                    <a href="/" style="background: var(--whatsapp-green); color: black; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 1.1rem;">Haz tu propio Wrapped</a>
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const h1 = this.element?.querySelector("h1");
        const emoji = this.element?.querySelector(".emoji");
        const p = this.element?.querySelector("p");

        if (h1) {
            this.tweens.push(gsap.fromTo(
                h1,
                { autoAlpha: 0, y: 20 },
                { autoAlpha: 1, y: 0, duration: 1 },
            ));
        }
        if (emoji) {
            this.tweens.push(gsap.fromTo(
                emoji,
                { scale: 0, rotate: -360, autoAlpha: 0 },
                {
                    scale: 1,
                    rotate: 0,
                    autoAlpha: 1,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.3)",
                },
            ));
        }
        if (p) {
            this.tweens.push(gsap.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, delay: 1 }));
        }
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll("h1, .emoji, p");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
