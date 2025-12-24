import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class GenericRankingSlide extends Slide {
    private data: WrappedData;
    private categoryKey: keyof WrappedData;
    private countKey: string;
    private title: string;
    private unit: string;

    constructor(data: WrappedData, categoryKey: keyof WrappedData, countKey: string, title: string, unit: string) {
        super();
        this.data = data;
        this.categoryKey = categoryKey;
        this.countKey = countKey;
        this.title = title;
        this.unit = unit;
    }

    getTemplate(): string {
        const list = (this.data[this.categoryKey] as any[]) || [];
        const top5 = list.slice(0, 5);

        const itemsHtml = top5.map((item, i) => {
            const name = this.data.participants[item.nameIndex];
            const count = item[this.countKey];
            return `
                <div class="ranking-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <div class="rank-info" style="display: flex; align-items: center;">
                        <span class="rank-number" style="font-size: 1.5rem; font-weight: bold; margin-right: 15px; color: #25d366;">#${i + 1}</span>
                        <span class="rank-name" style="font-size: 1.2rem;">${name}</span>
                    </div>
                    <span class="rank-count" style="font-size: 1.2rem; font-weight: bold;">${count} ${this.unit}</span>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper generic-ranking-slide">
            <div class="intro">
                <h2>${this.title}</h2>
            </div>
            <div class="ranking-list" style="margin-top: 30px;">
                ${itemsHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const items = this.element?.querySelectorAll(".ranking-item");

        const tl = gsap.timeline();
        if (title) tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        if (items) {
            tl.fromTo(items, 
                { x: -50, autoAlpha: 0 }, 
                { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 
                "-=0.4"
            );
        }
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .ranking-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
