import { Slide } from "../core/Slide";
import { gsap } from "gsap";

export class AwardsIntroSlide extends Slide {
    constructor() {
        super();
    }

    getTemplate(): string {
        return `
        <div class="content-wrapper awards-intro-slide">
            <style>
                .awards-intro-slide {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                }
                
                .awards-intro-slide .trophy {
                    font-size: 8rem;
                    margin-bottom: 30px;
                    filter: drop-shadow(0 10px 30px rgba(255, 215, 0, 0.5));
                    opacity: 0;
                }
                
                .awards-intro-slide h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #ffd700;
                    margin-bottom: 20px;
                    text-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
                    opacity: 0;
                }
                
                .awards-intro-slide p {
                    font-size: 1.3rem;
                    color: #e9edef;
                    max-width: 600px;
                    line-height: 1.6;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                    opacity: 0;
                }
            </style>
            
            <div class="trophy">🏆</div>
            <h2>Los Premios del Grupo</h2>
            <p>Es hora de reconocer a los miembros más destacados...</p>
        </div>
        `;
    }

    onEnter(): void {
        const trophy = this.element?.querySelector(".trophy");
        const title = this.element?.querySelector("h2");
        const subtitle = this.element?.querySelector("p");

        const tl = gsap.timeline();
        
        if (trophy) {
            tl.fromTo(trophy, 
                { scale: 0, rotation: -180, autoAlpha: 0 }, 
                { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.2, ease: "elastic.out(1, 0.5)" }
            );
        }
        
        if (title) {
            tl.fromTo(title, 
                { y: 50, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" },
                "-=0.5"
            );
        }
        
        if (subtitle) {
            tl.fromTo(subtitle, 
                { y: 30, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" },
                "-=0.6"
            );
        }
        
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".trophy, h2, p");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
