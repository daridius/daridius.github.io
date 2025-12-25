import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class TopStickersSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const stickers = this.data.top_stickers?.slice(0, 5) || [];
        if (stickers.length === 0) return '';

        const maxCount = stickers[0]?.count || 1;

        // Organic Cloud Layout (Rank 1 in center)
        const positions = [
            { top: '45%', left: '50%' }, // Rank 1 (Center)
            { top: '22%', left: '30%' }, // Rank 2
            { top: '72%', left: '28%' }, // Rank 3
            { top: '28%', left: '72%' }, // Rank 4
            { top: '75%', left: '75%' }  // Rank 5
        ];

        const bubblesHtml = stickers.map((item, i) => {
            const baseSize = 180;
            const minSize = 120;
            const relativeScale = Math.sqrt(item.count / maxCount);
            const size = Math.max(minSize, baseSize * relativeScale);
            const pos = positions[i];
            const rankClass = `rank-${i + 1}`;
            
            const crownHtml = i === 0 ? '<div class="b-crown" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">👑</div>' : '';

            return `
                <div class="member-bubble ${rankClass}" 
                    style="width: ${size}px; height: ${size}px; top: ${pos.top}; left: ${pos.left}; transform: translate(-50%, -50%); padding: 0; overflow: visible;">
                    ${crownHtml}
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 10px 25px rgba(0,0,0,0.4)); transition: transform 0.3s ease;">
                        <img src="data:image/webp;base64,${item.content}" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper top-stickers-slide">
            <style>
                .top-stickers-slide .member-bubble {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                }
                .top-stickers-slide .member-bubble::after {
                    display: none !important;
                }
                .top-stickers-slide .member-bubble.rank-1 {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                }
            </style>
            <div class="intro">
                <h2>Tus Stickers Favoritos</h2>
            </div>
            <div class="bubble-ranking-container" style="height: 100%; width: 100%;">
                ${bubblesHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const bubbles = this.element?.querySelectorAll(".member-bubble");

        const tl = gsap.timeline();
        
        if (title) {
            tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        }

        if (bubbles && bubbles.length > 0) {
            tl.fromTo(bubbles,
                { autoAlpha: 0, scale: 0, rotate: -45 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    rotate: 0,
                    stagger: 0.15,
                    duration: 1.2,
                    ease: "elastic.out(1, 0.7)",
                    onComplete: () => {
                        bubbles.forEach((el, idx) => {
                            (el as HTMLElement).classList.add('floating');
                            (el as HTMLElement).style.animationDelay = `${idx * 0.4}s`;
                        });
                    }
                },
                "-=0.4"
            );
        }
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .member-bubble");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
