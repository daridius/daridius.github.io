import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class StickerPeopleSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const list = this.data.top_sticker_senders?.slice(0, 3) || [];
        if (list.length === 0) return '';

        // Positions: Winner high center, Runners lower sides
        const positions = [
            { top: '40%', left: '50%', scale: 1.3, zIndex: 10 }, // Rank 1
            { top: '65%', left: '20%', scale: 0.9, zIndex: 5 },  // Rank 2
            { top: '65%', left: '80%', scale: 0.9, zIndex: 5 }   // Rank 3
        ];

        const itemsHtml = list.map((item, i) => {
            const name = this.data.participants[item.nameIndex];
            const pos = positions[i];
            const rankClass = `rank-${i + 1}`;
            
            // Crown for winner
            const crownHtml = i === 0 ? '<div class="crown" style="font-size: 3rem; position: absolute; top: -55px; left: 50%; transform: translateX(-50%) rotate(15deg); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); z-index: 20;">👑</div>' : '';
            
            // Styling nuances
            const nameColor = i === 0 ? '#ffd700' : '#e9edef';
            const glow = i === 0 ? 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))' : '';

            return `
                <div class="sticker-person-item ${rankClass}" 
                    style="position: absolute; top: ${pos.top}; left: ${pos.left}; transform: translate(-50%, -50%) scale(${pos.scale}); display: flex; flex-direction: column; align-items: center; z-index: ${pos.zIndex}; width: 220px;">
                    
                    ${crownHtml}
                    
                    <div class="p-name" style="font-size: 1.4rem; font-weight: 800; color: ${nameColor}; text-shadow: 0 2px 10px rgba(0,0,0,0.8); margin-bottom: 15px; text-align: center; line-height: 1.1; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${name}
                    </div>

                    <div class="p-sticker" style="position: relative; transition: transform 0.3s ease; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.5)) ${glow};">
                        <img src="data:image/webp;base64,${item.sticker}" style="width: 140px; height: 140px; object-fit: contain;" />
                    </div>

                    <div class="p-count" style="margin-top: 15px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        <span style="color: var(--whatsapp-green); font-weight: 800; font-size: 1.2rem;">${item.count}</span> <span style="font-size: 0.9rem; color: #ccc; font-weight: 500;">envíos</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper sticker-people-slide">
            <div class="intro">
                <h2>Los Reyes del Sticker</h2>
            </div>
            <div class="people-container" style="position: relative; width: 100%; height: 100%;">
                ${itemsHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const items = this.element?.querySelectorAll(".sticker-person-item");

        const tl = gsap.timeline();
        
        if (title) tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        
        if (items && items.length > 0) {
            // Define target scales based on rank
            const targetScales = [1.3, 0.9, 0.9];

            tl.fromTo(items, 
                { y: 100, autoAlpha: 0, scale: 0 }, 
                { 
                    y: 0, 
                    autoAlpha: 1, 
                    scale: (i) => targetScales[i], 
                    duration: 1, 
                    stagger: 0.2, 
                    ease: "elastic.out(1, 0.6)",
                    onComplete: () => {
                        items.forEach((el, idx) => {
                            // Floating animation
                            // Use a separate tween to ensure smooth transition from the entrance
                            gsap.to(el, {
                                y: -12, // Move up slightly
                                duration: 2 + idx * 0.5,
                                repeat: -1,
                                yoyo: true,
                                ease: "sine.inOut",
                                delay: 0.1 + idx * 0.2, // Small buffer to let entrance settle
                                overwrite: "auto"
                            });
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
        const elements = this.element?.querySelectorAll(".intro h2, .sticker-person-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
