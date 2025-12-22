import { Slide } from "../core/Slide";
import { type WrappedData, monthNames } from "../data";
import { gsap } from "gsap";

const fmt = (dStr: string) => {
    const d = new Date(dStr);
    const day = d.getUTCDate();
    const month = monthNames[d.getUTCMonth()];
    return `${day} de ${month}`;
};

export class ActivityStreakSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper activity-streak-slide-content">
            <div class="content">
                <h2 class="sub-title">Desde el</h2>
                <div class="dates">
                     <span class="highlight">${fmt(this.data.longest_activity_streak.from)}</span>
                    al
                    <span class="highlight">${fmt(this.data.longest_activity_streak.to)}</span>
                </div>

                <h1 class="main-msg">¡No pararon de hablar!</h1>

                <div class="streak-badge">
                    <span class="fire">🔥</span>
                    <span><span>${this.data.longest_activity_streak.days}</span> días seguidos</span>
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".sub-title");
        const dates = this.element?.querySelector(".dates");
        const mainMsg = this.element?.querySelector(".main-msg");
        const badge = this.element?.querySelector(".streak-badge");

        if (title && dates) {
            this.tweens.push(gsap.fromTo(
                [title, dates],
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 1 },
            ));
        }

        if (mainMsg) {
            this.tweens.push(gsap.fromTo(
                mainMsg,
                { scale: 0.5, autoAlpha: 0 },
                {
                    scale: 1,
                    autoAlpha: 1,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.6)",
                    delay: 0.5,
                },
            ));
        }

        if (badge) {
            this.tweens.push(gsap.fromTo(
                badge,
                { y: 50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, delay: 1 },
            ));
        }
    }

    onLeave(): void {
        this.killAnimations();
        // Hide all major animated groups
        const elements = this.element?.querySelectorAll(".sub-title, .dates, .main-msg, .streak-badge");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
