import { Slide } from "../core/Slide";
import { type WrappedData, monthNames } from "../data";
import { gsap } from "gsap";

export class PeakDaySlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const peakDay = this.data.peak_activity_day;
        if (!peakDay) return '';

        const dateObj = new Date(peakDay.date);
        const day = dateObj.getUTCDate();
        const month = monthNames[dateObj.getUTCMonth()];

        return `
        <div class="content-wrapper peak-day-slide-content">
            <h2>Pero el prime del grupo fue el...</h2>

            <div class="calendar-reveal">
                <div class="calendar-icon">
                    <div class="cal-month">${month}</div>
                    <div class="cal-day">${day}</div>
                </div>
                <div class="msg-count">
                    <span>${peakDay.messages}</span> mensajes
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector("h2");
        const calendar = this.element?.querySelector(".calendar-reveal");

        if (title) {
            this.tweens.push(gsap.fromTo(
                title,
                { autoAlpha: 0, y: -20 },
                { autoAlpha: 1, y: 0, duration: 1 },
            ));
        }

        if (calendar) {
            this.tweens.push(gsap.fromTo(
                calendar,
                { scale: 0, rotate: -30, autoAlpha: 0 },
                {
                    scale: 1,
                    rotate: 0,
                    autoAlpha: 1,
                    duration: 1,
                    ease: "elastic.out(1, 0.6)",
                    delay: 0.5,
                },
            ));
        }
    }


    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll("h2, .calendar-reveal");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
