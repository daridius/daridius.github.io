import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class RankingBubblesSlide extends Slide {
    private data: WrappedData;
    private showWinner: boolean;

    constructor(data: WrappedData, showWinner: boolean = false) {
        super();
        this.data = data;
        this.showWinner = showWinner;
    }

    getTemplate(): string {
        const sorted = [...this.data.top_senders].sort((a, b) => b.messages - a.messages);

        // Positions for Top 5 (offsets from center)
        const positions = [
            { top: '45%', left: '50%' },   // #1 (Center)
            { top: '25%', left: '30%' },   // #2 (Top Left)
            { top: '70%', left: '75%' },   // #3 (Bottom Right)
            { top: '25%', left: '75%' },   // #4 (Top Right)
            { top: '70%', left: '25%' }    // #5 (Bottom Left)
        ];

        const maxMessages = sorted[0]?.messages || 1;

        const bubblesHtml = sorted.slice(0, 5).map((sender, i) => {
            const rank = i + 1;
            if (!this.showWinner && rank === 1) return ''; // Hide #1 in the first view

            // Improved Scale Logic: Area-based with a healthy Minimum Size
            const baseSize = 200; // Winner size
            const minSize = 120; // Smallest bubbles won't clip names

            const relativeScale = Math.sqrt(sender.messages / maxMessages);
            const size = Math.max(minSize, baseSize * relativeScale);

            const pos = positions[i];
            const isWinner = rank === 1;

            return `
                <div class="member-bubble rank-${rank} ${isWinner ? 'is-winner' : ''}" 
                    style="width: ${size}px; height: ${size}px; top: ${pos.top}; left: ${pos.left}; transform: translate(-50%, -50%)">
                    ${isWinner ? '<div class="b-crown">👑</div>' : ''}
                    <div class="b-name">${sender.name}</div>
                    <div class="b-count">${sender.messages.toLocaleString()}</div>
                </div>
            `;
        }).join('');

        const title = this.showWinner ? "¡Rey del Teclado!" : "Los que mantuvieron el chat vivo...";

        return `
        <div class="content-wrapper bubble-ranking-slide">
            <h2 class="title">${title}</h2>
            <div class="bubble-ranking-container">
                ${bubblesHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".title");
        const bubbles = this.element?.querySelectorAll(".member-bubble");
        const winner = this.element?.querySelector(".member-bubble.rank-1");

        if (title) {
            this.tweens.push(gsap.fromTo(title, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.8 }));
        }

        if (bubbles && bubbles.length > 0) {
            const others = Array.from(bubbles).filter(b => !b.classList.contains('rank-1'));

            // Animate non-winners
            this.tweens.push(gsap.fromTo(others,
                { autoAlpha: 0, scale: 0, rotate: -45 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    rotate: 0,
                    stagger: 0.15,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.7)",
                    onComplete: () => {
                        others.forEach((el, idx) => {
                            (el as HTMLElement).classList.add('floating');
                            (el as HTMLElement).style.animationDelay = `${idx * 0.4}s`;
                        });
                    }
                }
            ));
        }

        if (this.showWinner && winner) {
            // Winner entry - No more scale jumps or untracked onComplete tweens
            this.tweens.push(gsap.fromTo(winner,
                { autoAlpha: 0, scale: 0, y: 30 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    y: 0,
                    duration: 1.5,
                    delay: 0.6,
                    ease: "elastic.out(1, 0.5)",
                    onComplete: () => {
                        (winner as HTMLElement).classList.add('floating');
                    }
                }
            ));

            const crown = winner.querySelector(".b-crown");
            if (crown) {
                this.tweens.push(gsap.fromTo(crown,
                    { autoAlpha: 0, y: -40, scale: 0, rotate: -20 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        rotate: 0,
                        delay: 1.4,
                        duration: 0.8,
                        ease: "back.out(2)"
                    }
                ));
            }
        }
    }

    onLeave(): void {
        this.killAnimations();
        const els = this.element?.querySelectorAll(".title, .member-bubble");
        if (els) gsap.set(els, { autoAlpha: 0 });
    }
}
