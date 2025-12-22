import { Slide } from "../core/Slide";
import { type WrappedData, monthNames } from "../data";
import { gsap } from "gsap";

const fmt = (dStr: string) => {
    const d = new Date(dStr);
    const day = d.getUTCDate();
    const month = monthNames[d.getUTCMonth()];
    return `${day} de ${month}`;
};

export class SilenceStreakSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper silence-slide-content">
             <div class="content">
                <h2>Y aunque desde el</h2>
                <div class="dates">
                    <span class="highlight">${fmt(this.data.longest_silence_streak.from)}</span>
                    al
                    <span class="highlight">${fmt(this.data.longest_silence_streak.to)}</span>
                </div>
                <h2>no hubo señales de vida...</h2>

                <div class="emoji-reaction">🦗</div>
                <div class="days-count">
                    <span>${this.data.longest_silence_streak.days}</span> días de silencio
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const content = this.element?.querySelector(".content");
        const emoji = this.element?.querySelector(".emoji-reaction");

        if (content) {
            gsap.fromTo(
                content,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 1 },
            );
        }

        if (emoji) {
            gsap.fromTo(
                emoji,
                { scale: 0, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.8, ease: "bounce.out", delay: 0.5 },
            );
        }
    }

    onLeave(): void {
        const elements = this.element?.querySelectorAll(".content, .emoji-reaction, .calendar");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
