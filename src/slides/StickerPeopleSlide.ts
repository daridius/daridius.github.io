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

        const itemsHtml = list.map((item, i) => {
            const name = this.data.participants[item.nameIndex];
            return `
                <div class="sticker-user-item" style="display: flex; align-items: center; margin-bottom: 20px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 10px;">
                    <img src="data:image/webp;base64,${item.sticker}" style="width: 80px; height: 80px; object-fit: contain; margin-right: 20px;" />
                    <div class="info">
                        <div class="user-name" style="font-weight: bold; font-size: 1.2rem;">${name}</div>
                        <div class="count">Envió este sticker ${item.count} veces</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
        <div class="content-wrapper sticker-people-slide">
            <div class="intro">
                <h2>Asociación Ilícita de Stickers</h2>
            </div>
            <div class="list-container" style="margin-top: 30px;">
                ${itemsHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const items = this.element?.querySelectorAll(".sticker-user-item");

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
        const elements = this.element?.querySelectorAll(".intro h2, .sticker-user-item");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
