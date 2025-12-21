export abstract class Slide {
    protected element: HTMLElement | null = null;

    constructor() { }

    /**
     * Returns the HTML template string for this slide.
     */
    abstract getTemplate(): string;

    /**
     * Called when the slide has been injected into the DOM.
     * Use this to query selectors and set up specific initial states.
     */
    onMount(element: HTMLElement): void {
        this.element = element;
    }

    /**
     * Called when the slide becomes active.
     * Use this to trigger GSAP entry animations.
     */
    abstract onEnter(): void;

    /**
     * Called when the slide is about to leave.
     * Use this to cleanup or trigger exit animations if handled manually.
     * Note: StoryController usually handles the main slide-out transition.
     */
    abstract onLeave(): void;
}
