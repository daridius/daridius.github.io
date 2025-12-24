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
        const stickers = this.data.top_stickers?.slice(0, 3) || [];
        
        const stickersHtml = stickers.map((item, i) => {
            return `
                <div class="sticker-item rank-${i+1}" style="display: flex; flex-direction: column; align-items: center; margin: 10px;">
                    <img src="data:image/webp;base64,${item.content}" style="width: 150px; height: 150px; object-fit: contain;" />
                    <span class="sticker-count" style="margin-top: 10px; font-weight: bold;">${item.count} veces</span>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper top-stickers-slide">
            <div class="intro">
                <h2>Los Stickers Favoritos</h2>
            </div>
            <div class="stickers-container" style="display: flex; justify-content: center; align-items: flex-end; height: 60%; flex-wrap: wrap;">
                ${stickersHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const items = this.element?.querySelectorAll(".sticker-item");

        const tl = gsap.timeline();
        if (title) tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        if (items) {
            tl.fromTo(items, 
                { scale: 0, autoAlpha: 0 }, 
                { scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.2, ease: "elastic.out(1, 0.5)" }, 
                "-=0.4"
            );
        }
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .sticker-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
