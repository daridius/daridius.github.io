import { Slide } from "../core/Slide";
import { gsap } from "gsap";

export class AwardsOutroSlide extends Slide {
    constructor() {
        super();
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper awards-outro-slide">
            <style>
                .awards-outro-slide {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                }
                
                .awards-outro-slide .emoji {
                    font-size: 6rem;
                    margin-bottom: 30px;
                    opacity: 0;
                }
                
                .awards-outro-slide h2 {
                    font-size: 2.2rem;
                    font-weight: 300;
                    color: #e9edef;
                    margin-bottom: 20px;
                    opacity: 0;
                    line-height: 1.4;
                }
                
                .awards-outro-slide p {
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    max-width: 600px;
                    line-height: 1.6;
                    opacity: 0;
                }
            </style>
            
            <div class="emoji">🏆</div>
            <h2>Muy divertido, ¿no?</h2>
            <p>¡Pero aún quedan más datos por ver!</p>
        </div>
        `;
    }

    onEnter(): void {
        const emoji = this.element?.querySelector(".emoji");
        const title = this.element?.querySelector("h2");
        const subtitle = this.element?.querySelector("p");

        const tl = gsap.timeline();
        
        if (emoji) {
            tl.fromTo(emoji, 
                { scale: 0, rotation: -180, autoAlpha: 0 }, 
                { scale: 1, rotation: 0, autoAlpha: 1, duration: 1, ease: "back.out(1.5)" }
            );
        }
        
        if (title) {
            tl.fromTo(title, 
                { y: 30, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" },
                "-=0.5"
            );
        }
        
        if (subtitle) {
            tl.fromTo(subtitle, 
                { y: 20, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" },
                "-=0.6"
            );
        }
        
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".emoji, h2, p");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
