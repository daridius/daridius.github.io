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
        const winnerData = this.data[this.categoryKey] as any;
        if (!winnerData) return '';
        
        const name = this.data.participants[winnerData.nameIndex];
        const count = winnerData[this.countKey];

        return `
        <div class="content-wrapper generic-winner-slide">
            <div class="intro">
                <h2>${this.title}</h2>
            </div>
            <div class="winner-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60%;">
                <div class="winner-emoji" style="font-size: 8rem; margin-bottom: 20px;">${this.emoji}</div>
                <div class="winner-name" style="font-size: 3rem; font-weight: bold; color: #25d366; text-align: center;">${name}</div>
                <div class="winner-stat" style="font-size: 1.5rem; opacity: 0.8; margin-top: 10px;">${count} ${this.unit}</div>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const emoji = this.element?.querySelector(".winner-emoji");
        const name = this.element?.querySelector(".winner-name");
        const stat = this.element?.querySelector(".winner-stat");

        const tl = gsap.timeline();
        if (title) tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        if (emoji) tl.fromTo(emoji, { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" }, "-=0.4");
        if (name) tl.fromTo(name, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.6");
        if (stat) tl.fromTo(stat, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, "-=0.4");
        
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .winner-emoji, .winner-name, .winner-stat");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
