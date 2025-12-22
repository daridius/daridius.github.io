import { Slide } from "../core/Slide";
import { gsap } from "gsap";

export class SuspenseSlide extends Slide {
    private text: string;

    constructor(text: string) {
        super();
        this.text = text;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper suspense-slide-content">
            <h2 class="suspense-text">${this.text}</h2>
        </div>
        `;
    }

    onEnter(): void {
        const text = this.element?.querySelector(".suspense-text");
        if (text) {
            this.tweens.push(gsap.fromTo(text,
                { autoAlpha: 0, scale: 0.8, filter: "blur(10px)" },
                {
                    autoAlpha: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    duration: 1.5,
                    ease: "power2.out"
                }
            ));
        }
    }

    onLeave(): void {
        this.killAnimations();
        const text = this.element?.querySelector(".suspense-text");
        if (text) gsap.set(text, { autoAlpha: 0 });
    }
}
