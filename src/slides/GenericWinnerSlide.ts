import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class GenericWinnerSlide extends Slide {
    private data: WrappedData;
    private categoryKey: keyof WrappedData;
    private countKey: string;
    private title: string;
    private emoji: string;
    private unit: string;

    constructor(data: WrappedData, categoryKey: keyof WrappedData, countKey: string, title: string, emoji: string, unit: string) {
        super();
        this.data = data;
        this.categoryKey = categoryKey;
        this.countKey = countKey;
        this.title = title;
        this.emoji = emoji;
        this.unit = unit;
    }

    getTemplate(): string {
        let winnerData = this.data[this.categoryKey] as any;
        if (!winnerData) return '';
        
        // Handle array case (take first element)
        if (Array.isArray(winnerData)) {
            if (winnerData.length === 0) return '';
            winnerData = winnerData[0];
        }
        
        const name = this.data.participants[winnerData.nameIndex];
        const count = winnerData[this.countKey];

        // Adjust chip size for long text
        const isLongText = this.unit.length > 10;
        const chipPadding = isLongText ? '6px 18px' : '8px 24px';
        const chipFontSize = isLongText ? '0.9rem' : '1rem';
        const countFontSize = isLongText ? '1.4rem' : '1.6rem';

        // Confetti Fountain (Bottom)
        const confettiCount = 150;
        const confettiHtml = Array.from({ length: confettiCount }).map(() => {
            const left = Math.random() * 100;
            return `<div class="confetti-piece" style="position: absolute; bottom: -10px; left: ${left}%; width: 10px; height: 10px;"></div>`;
        }).join('');

        return `
        <div class="content-wrapper generic-winner-slide" style="overflow: hidden; perspective: 1000px;">
            <!-- Rotating Sunburst Background -->
            <div class="sunburst-bg" style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: repeating-conic-gradient(from 0deg, rgba(255,255,255,0.03) 0deg 10deg, transparent 10deg 20deg); z-index: 0;"></div>

            <div class="confetti-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 20;">
                ${confettiHtml}
            </div>
            
            <div class="intro" style="z-index: 2; position: relative; margin-bottom: 30px;">
                <h2 style="text-shadow: 0 4px 8px rgba(0,0,0,0.6); font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">${this.title}</h2>
            </div>
            
            <!-- Main Card -->
            <div class="winner-card" style="z-index: 10; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); padding: 40px 30px; border-radius: 40px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 25px 60px rgba(0,0,0,0.5); transform-style: preserve-3d; width: 85%; max-width: 400px;">
                
                <div class="winner-emoji-wrapper" style="position: relative; margin-bottom: 25px;">
                    <div class="winner-emoji" style="font-size: 7rem; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.4));">${this.emoji}</div>
                    <div class="sparkle s1" style="position: absolute; top: -10px; right: -10px; font-size: 2rem;">✨</div>
                    <div class="sparkle s2" style="position: absolute; bottom: 10px; left: -20px; font-size: 1.5rem;">✨</div>
                </div>

                <div class="winner-name" style="font-size: 2.2rem; font-weight: 900; color: #fff; text-align: center; margin-bottom: 15px; line-height: 1.1; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${name}</div>
                
                <div class="winner-stat" style="background: linear-gradient(90deg, var(--whatsapp-green), #128C7E); padding: ${chipPadding}; border-radius: 50px; box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3); display: inline-flex; align-items: center; gap: 10px;">
                    <span style="font-size: ${countFontSize}; font-weight: 800; color: #fff; flex-shrink: 0;">${count}</span> 
                    <span style="font-size: ${chipFontSize}; opacity: 0.9; color: #fff; font-weight: 600; text-transform: uppercase; white-space: nowrap;">${this.unit}</span>
                </div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const bg = this.element?.querySelector(".sunburst-bg");
        const title = this.element?.querySelector(".intro h2");
        const card = this.element?.querySelector(".winner-card");
        const emoji = this.element?.querySelector(".winner-emoji");
        const sparkles = this.element?.querySelectorAll(".sparkle");
        const confetti = this.element?.querySelectorAll(".confetti-piece");

        const tl = gsap.timeline();
        
        // 1. Background Rotation
        if (bg) {
            gsap.to(bg, { rotation: 360, duration: 20, repeat: -1, ease: "linear" });
            tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 1 });
        }

        // 2. Title Fade In
        if (title) tl.fromTo(title, { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.5");
        
        // 3. Card Pop In
        if (card) {
            tl.fromTo(card, 
                { scale: 0, rotationY: 90, autoAlpha: 0 }, 
                { scale: 1, rotationY: 0, autoAlpha: 1, duration: 1.2, ease: "elastic.out(1, 0.7)" }, 
                "-=0.6"
            );
        }

        // 4. Emoji Bounce
        if (emoji) {
            tl.fromTo(emoji, 
                { scale: 0 }, 
                { scale: 1, duration: 0.8, ease: "back.out(2)" }, 
                "-=1"
            );
        }

        // 5. Sparkles
        if (sparkles && sparkles.length > 0) {
            tl.fromTo(sparkles,
                { scale: 0, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.2, ease: "back.out" },
                "-=0.5"
            );
            gsap.to(sparkles, { scale: 1.3, rotation: 15, duration: 0.5, yoyo: true, repeat: -1, stagger: 0.3 });
        }

        // 6. Confetti Fountain
        if (confetti && confetti.length > 0) {
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF00FF'];
            
            // Add a label to sync start
            tl.add("confettiStart", "-=1.0");

            confetti.forEach((piece) => {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const duration = 2.5 + Math.random();
                
                // Physics simulation
                const velocityY = -window.innerHeight * (0.7 + Math.random() * 0.4); // Shoot up 70-110% of screen height
                const driftX = (Math.random() - 0.5) * 300; // Random sideways drift
                
                gsap.set(piece, { 
                    backgroundColor: color, 
                    x: 0, 
                    y: 0, 
                    scale: Math.random() * 0.6 + 0.4,
                    rotation: Math.random() * 360,
                    autoAlpha: 1 // Ensure visibility (overrides CSS visibility: hidden)
                });
                
                // Create a sub-timeline for each piece to combine x and y cleanly
                const pieceTl = gsap.timeline();

                // Y Axis: Up and Down (Gravity Arc)
                pieceTl.to(piece, {
                    keyframes: {
                        "0%": { y: 0 },
                        "45%": { y: velocityY, ease: "power2.out" }, // Decelerate to peak
                        "100%": { y: 100, ease: "power2.in" }         // Accelerate down
                    },
                    duration: duration,
                    ease: "none"
                }, 0);

                // X Axis: Linear drift & Rotation
                pieceTl.to(piece, {
                    x: driftX,
                    rotation: Math.random() * 1080,
                    duration: duration,
                    ease: "none"
                }, 0);

                // Add to main timeline with stagger
                tl.add(pieceTl, `confettiStart+=${Math.random() * 0.5}`);
            });
        }
        
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .winner-card, .confetti-piece, .sunburst-bg");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
