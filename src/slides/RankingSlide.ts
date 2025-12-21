import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class RankingSlide extends Slide {
    private sortedSenders: { name: string; messages: number }[];

    constructor(data: WrappedData) {
        super();
        this.sortedSenders = [...data.top_senders].sort((a, b) => b.messages - a.messages);
    }

    getTemplate(): string {
        const sendersHtml = this.sortedSenders.map((sender, index) => {
            const rankClass = `rank-${index + 1}`;
            const crownHtml = index === 0 ? '<div class="crown">👑</div>' : '';
            return `
                <div class="rank-card ${rankClass}">
                    <div class="rank-number">#${index + 1}</div>
                    <div class="avatar-placeholder">${sender.name[0]}</div>
                    <div class="info">
                        <div class="name">${sender.name}</div>
                        <div class="count">${sender.messages.toLocaleString()} mensajes</div>
                    </div>
                    ${crownHtml}
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper ranking-slide-content">
            <h2 class="header-title">Los que más escribieron...</h2>
            <div class="ranking-list">
                ${sendersHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".header-title");
        const cards = this.element?.querySelectorAll(".rank-card");

        if (title) {
            gsap.fromTo(
                title,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.8 }
            );
        }

        if (cards && cards.length > 0) {
            gsap.fromTo(
                cards,
                { x: 50, opacity: 0 },
                {
                    x: 0,
                    opacity: 1,
                    stagger: 0.2,
                    duration: 0.6,
                    delay: 0.3,
                    ease: "power2.out",
                }
            );
        }
    }

    onLeave(): void { }
}
