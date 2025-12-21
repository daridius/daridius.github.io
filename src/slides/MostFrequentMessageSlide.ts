import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class MostFrequentMessageSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const msg = this.data.most_frequent_message;
        return `
        <div class="content-wrapper most-frequent-msg-slide-content">
            <div class="intro">
                <h2>Hubo un mensaje que se repitió hasta el cansancio...</h2>
            </div>

            <div class="message-container">
                <div class="message-bubble">
                    <div class="msg-header">
                        <span class="author">${msg.author}</span>
                    </div>
                    <div class="msg-content">
                        ${msg.content}
                    </div>
                    <div class="msg-meta">
                        <span class="time">Enviado <span>${msg.count}</span> veces</span>
                        <span class="checks">✓✓</span>
                    </div>
                </div>
                <div class="badge">SPAM DEL AÑO</div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const container = this.element?.querySelector(".message-container");
        const badge = this.element?.querySelector(".badge");

        if (title) {
            gsap.fromTo(
                title,
                { y: -50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8 },
            );
        }

        if (container) {
            gsap.fromTo(
                container,
                { y: 100, autoAlpha: 0, scale: 0.9 },
                {
                    y: 0,
                    autoAlpha: 1,
                    scale: 1,
                    duration: 1,
                    delay: 0.5,
                    ease: "power3.out",
                },
            );
        }

        if (badge) {
            gsap.fromTo(
                badge,
                { scale: 0, rotate: 180 },
                {
                    scale: 1,
                    rotate: -10,
                    duration: 0.6,
                    delay: 1.2,
                    ease: "back.out",
                },
            );
        }
    }

    onLeave(): void { }
}
