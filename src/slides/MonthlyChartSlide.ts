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
        const chart = this.element?.querySelector(".chart-container");
        const bars = this.element?.querySelectorAll(".bar");
        const highlight = this.element?.querySelector(".peak-month-highlight");

        if (title) {
            gsap.fromTo(
                title,
                { autoAlpha: 0, y: -50 },
                { autoAlpha: 1, y: 0, duration: 1 },
            );
        }

        if (chart) {
            gsap.to(chart, { autoAlpha: 1, duration: 0.5 });
        }

        if (bars && bars.length > 0) {
            gsap.fromTo(
                bars,
                { height: 0 },
                {
                    height: (_i, t) => t.dataset.height,
                    stagger: 0.05,
                    duration: 1.2,
                    ease: "power2.out",
                    delay: 0.5,
                },
            );
        }

        if (highlight) {
            gsap.fromTo(
                highlight,
                { autoAlpha: 0, y: 10 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1,
                    delay: 1.5,
                    ease: "power2.out",
                },
            );
        }
    }

    onLeave(): void { }
}
