import { gsap } from "gsap";
import { Slide } from "./Slide";

export class StoryController {
    private container: HTMLElement;
    private slides: Slide[] = [];
    private currentSlideIndex: number = 0;
    private isAnimating: boolean = false;
    private slideElements: HTMLElement[] = [];

    private touchStartX: number = 0;
    private touchEndX: number = 0;

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
        }).join('') + this.getNavigationOverlay() + this.getHintsOverlay();

        // Mount slides
        this.slideElements = Array.from(this.container.querySelectorAll('.slide')) as HTMLElement[];
        this.slides.forEach((slide, index) => {
            slide.onMount(this.slideElements[index]);
        });

        // Show first slide
        const firstSlideEl = this.slideElements[0];
        gsap.set(firstSlideEl, { autoAlpha: 1, zIndex: 150 });
        this.slides[0].onEnter();

        // Setup navigation listeners
        this.bindNavigationEvents();

        // Show hints overlay after a small delay
        this.showHints();
    }

    private getNavigationOverlay(): string {
        return `
        <div class="navigation-overlay">
            <div class="nav-left"></div>
            <div class="nav-right"></div>
        </div>`;
    }

    private getHintsOverlay(): string {
        return `
        <div class="nav-hints">
            <div class="hint-tap left">
                <div class="tap-circle"></div>
                <span>Atrás</span>
            </div>
            <div class="hint-tap right">
                <div class="tap-circle"></div>
                <span>Siguiente</span>
            </div>
        </div>`;
    }

    private showHints() {
        const hints = this.container.querySelector('.nav-hints');
        if (hints) {
            // Appear after 1 second as requested
            setTimeout(() => hints.classList.add('visible'), 1000);

            const hide = () => {
                hints.classList.remove('visible');
                setTimeout(() => (hints as HTMLElement).style.display = 'none', 800);
                window.removeEventListener('touchstart', hide);
                window.removeEventListener('click', hide);
            };

            // Hide on any interaction
            window.addEventListener('touchstart', hide);
            window.addEventListener('click', hide);

            // Auto hide after 6 seconds total
            setTimeout(hide, 6000);
        }
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

        // Swipe Detection
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

    private handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const threshold = 50;

        if (swipeDistance < -threshold) {
            // Swiped Left -> Next
            this.next();
        } else if (swipeDistance > threshold) {
            // Swiped Right -> Prev
            this.prev();
        }
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

        fromSlideInstance.onExitStart(); // Stop internal animations immediately
        this.currentSlideIndex = toIndex;

        const tl = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                gsap.set(fromEl, { autoAlpha: 0, zIndex: 0 });
                fromSlideInstance.onLeave(); // Clean up state off-screen
            },
        });

        // Simple scale/fade transition
        tl.to(fromEl, {
            duration: 0.5,
            autoAlpha: 0,
            scale: 0.95,
            ease: "power2.inOut",
        });

        tl.fromTo(
            toEl,
            { autoAlpha: 0, scale: 1.05, zIndex: 150 },
            { duration: 0.5, autoAlpha: 1, scale: 1, ease: "power2.out" },
            "<",
        );


        // Notify new slide
        tl.add(() => {
            toSlideInstance.onEnter();
        }, "-=0.2");
    }
}
