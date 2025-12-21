import { gsap } from "gsap";
import { Slide } from "./Slide";

export class StoryController {
    private container: HTMLElement;
    private slides: Slide[] = [];
    private currentSlideIndex: number = 0;
    private isAnimating: boolean = false;
    private slideElements: HTMLElement[] = [];

    constructor(containerId: string) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Container #${containerId} not found`);
        this.container = el;

        this.initNavigation();
    }

    public addSlide(slide: Slide) {
        this.slides.push(slide);
    }

    public start() {
        if (this.slides.length === 0) return;

        // Render all slides
        this.container.innerHTML = this.slides.map((slide, index) => {
            return `<div class="slide slide-${index}" data-index="${index}">
                ${slide.getTemplate()}
            </div>`;
        }).join('') + this.getNavigationOverlay();

        // Mount slides
        this.slideElements = Array.from(this.container.querySelectorAll('.slide')) as HTMLElement[];
        this.slides.forEach((slide, index) => {
            slide.onMount(this.slideElements[index]);
        });

        // Show first slide
        const firstSlideEl = this.slideElements[0];
        gsap.set(firstSlideEl, { autoAlpha: 1, zIndex: 10 });
        this.slides[0].onEnter();

        // Setup navigation listeners again since we overwrote innerHTML
        this.bindNavigationEvents();
    }

    private getNavigationOverlay(): string {
        return `
        <div class="navigation-overlay">
            <div class="nav-left"></div>
            <div class="nav-right"></div>
        </div>`;
    }

    private initNavigation() {
        window.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight" || e.key === "Space" || e.key === "Enter") {
                this.next();
            }
            if (e.key === "ArrowLeft") {
                this.prev();
            }
        });
    }

    private bindNavigationEvents() {
        const left = this.container.querySelector('.nav-left');
        const right = this.container.querySelector('.nav-right');

        left?.addEventListener('click', () => this.prev());
        right?.addEventListener('click', () => this.next());
    }

    public next() {
        if (this.isAnimating || this.currentSlideIndex >= this.slides.length - 1) return;
        this.transition(this.currentSlideIndex, this.currentSlideIndex + 1);
    }

    public prev() {
        if (this.isAnimating || this.currentSlideIndex <= 0) return;
        this.transition(this.currentSlideIndex, this.currentSlideIndex - 1);
    }

    private transition(fromIndex: number, toIndex: number) {
        this.isAnimating = true;

        const fromSlideInstance = this.slides[fromIndex];
        const toSlideInstance = this.slides[toIndex];

        const fromEl = this.slideElements[fromIndex];
        const toEl = this.slideElements[toIndex];

        fromSlideInstance.onLeave();
        this.currentSlideIndex = toIndex;

        const tl = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                gsap.set(fromEl, { autoAlpha: 0, zIndex: 0 });
            },
        });

        // Simple scale/fade transition
        tl.to(fromEl, {
            duration: 0.5,
            opacity: 0,
            scale: 0.95,
            ease: "power2.inOut",
        });

        tl.set(toEl, { autoAlpha: 1, zIndex: 10 }, "<");

        tl.fromTo(
            toEl,
            { opacity: 0, scale: 1.05 },
            { duration: 0.5, opacity: 1, scale: 1, ease: "power2.out" },
            "<",
        );

        // Notify new slide
        tl.add(() => {
            toSlideInstance.onEnter();
        }, "-=0.2");
    }
}
