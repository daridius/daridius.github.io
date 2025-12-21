import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class IntroSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper intro-slide-content">
            <div class="year-container">
                <h2 class="pre-title">El ${this.data.year} de</h2>
                <h1 class="group-name">${this.data.group_name}</h1>
                <h2 class="post-title">WHATSAPP WRAPPED</h2>
                <h3 class="story-subtitle">Este año hubo mucho que contar...</h3>
            </div>
            <div class="decorations">
                <span class="bubble b1" style="--d: 1s"></span>
                <span class="bubble b2" style="--d: 2s"></span>
                <span class="bubble b3" style="--d: 0.5s"></span>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const tl = gsap.timeline();

        // Animate Container
        tl.fromTo(
            this.element!.querySelector(".year-container"),
            { scale: 0.8, autoAlpha: 0 },
            {
                scale: 1,
                autoAlpha: 1,
                duration: 1,
                ease: "slow(0.7, 0.7, false)",
            }
        );

        // Animate Bubbles
        tl.fromTo(
            this.element!.querySelectorAll(".bubble"),
            { scale: 0 },
            { scale: 1, stagger: 0.2, duration: 0.8, ease: "back.out" },
            "-=0.5"
        );
    }

    onLeave(): void {
        // Cleanup if needed
    }
}
