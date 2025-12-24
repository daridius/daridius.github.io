import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class NewPeopleSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const newPeopleIndices = this.data.new_people || [];
        if (newPeopleIndices.length === 0) return '';

        const names = newPeopleIndices.map(i => this.data.participants[i]).join(', ');

        return `
        <div class="content-wrapper new-people-slide">
            <div class="intro">
                <h2>¡Bienvenidos! 👋</h2>
            </div>
            <div class="people-list" style="font-size: 2rem; text-align: center; margin-top: 40px;">
                <p>Este año se unieron al grupo:</p>
                <p style="color: #25d366; font-weight: bold; margin-top: 20px;">${names}</p>
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const list = this.element?.querySelector(".people-list");

        const tl = gsap.timeline();
        if (title) tl.fromTo(title, { y: -50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        if (list) tl.fromTo(list, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8 }, "-=0.4");
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .people-list");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
