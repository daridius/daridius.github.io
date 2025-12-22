import { Slide } from "../core/Slide";
import { type WrappedData, monthNames } from "../data";
import { gsap } from "gsap";

export class MonthlyChartSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const entries = Object.entries(this.data.messages_per_month).map(([k, v]) => [
            Number(k),
            v,
        ]) as [number, number][];

        entries.sort((a, b) => a[0] - b[0]);

        let peakMonthIndex = 0;
        let peakMonthCount = 0;
        entries.forEach(([m, count]) => {
            if (count > peakMonthCount) {
                peakMonthCount = count;
                peakMonthIndex = m;
            }
        });
        const peakMonthName = monthNames[peakMonthIndex - 1];

        const sortedCounts = entries.map((e) => e[1]);
        const maxCount = Math.max(...sortedCounts);

        const barsHtml = entries.map(([monthIndex, count]) => {
            const isPeak = monthIndex === peakMonthIndex;
            const height = (count / maxCount) * 100;
            return `
            <div class="bar-wrapper">
                <div class="bar ${isPeak ? "peak-bar" : ""}" style="height: 0%;" data-height="${height}%"></div>
                <div class="month-label">${monthNames[monthIndex - 1].substring(0, 3)}</div>
            </div>
           `;
        }).join('');

        return `
        <div class="content-wrapper monthly-slide-content">
            <h2>Cada mes tuvo sus propias historias</h2>

            <div class="chart-container">
                ${barsHtml}
            </div>

            <div class="peak-month-highlight">
                <p>
                    En <span class="highlight">${peakMonthName}</span> el chat explotó con
                    <span class="highlight">${peakMonthCount}</span> mensajes 🔥
                </p>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector("h2");
        const container = this.element?.querySelector(".chart-container");
        const highlight = this.element?.querySelector(".peak-month-highlight");

        if (title) {
            this.tweens.push(gsap.fromTo(
                title,
                { y: -50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8 },
            ));
        }

        if (container) {
            this.tweens.push(gsap.fromTo(
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
            ));
        }

        if (highlight) {
            this.tweens.push(gsap.fromTo(
                highlight,
                { autoAlpha: 0, y: 10 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1,
                    delay: 1.5,
                    ease: "power2.out",
                },
            ));
        }
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll("h2, .chart-container, .peak-month-highlight");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
