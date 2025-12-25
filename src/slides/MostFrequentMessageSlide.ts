import { Slide } from "../core/Slide";
import type { WrappedData } from "../data";
import { gsap } from "gsap";

export class MostFrequentMessageSlide extends Slide {
    private data: WrappedData;

    constructor(data: WrappedData) {
        super();
        this.data = data;
    }

    getTemplate(): string {
        const messages = this.data.most_frequent_message?.slice(0, 3) || [];
        if (messages.length === 0) return '';

        const winner = messages[0];
        const runnersUp = messages.slice(1);

        // Winner HTML
        const winnerAuthor = this.data.participants[winner.authorIndex];
        const winnerHtml = `
            <div class="message-container winner" style="margin-bottom: 20px; z-index: 3;">
                <div class="message-bubble">
                    <div class="msg-header"><span class="author">${winnerAuthor}</span></div>
                    <div class="msg-content">${winner.content}</div>
                    <div class="msg-meta">
                        <span class="time">Enviado <span>${winner.count}</span> veces</span>
                        <span class="checks">✓✓</span>
                    </div>
                </div>
                <div class="badge">SPAM DEL AÑO 🏆</div>
            </div>
        `;

        // Runners up HTML
        let runnersUpHtml = '';
        if (runnersUp.length > 0) {
            const itemsHtml = runnersUp.map((msg, i) => {
                const author = this.data.participants[msg.authorIndex];
                return `
                <div class="message-container runner-up" style="flex: 1; width: auto; max-width: none; margin: 0; opacity: 0.9;">
                    <div class="message-bubble" style="padding: 1.2rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                        <div class="msg-header" style="font-size: 0.8rem; margin-bottom: 0.4rem;"><span class="author">${author}</span></div>
                        <div class="msg-content" style="font-size: 1.1rem; margin-bottom: 0.5rem; line-height: 1.2;">${msg.content}</div>
                        <div class="msg-meta" style="font-size: 0.75rem;">
                            <span class="time"><span>${msg.count}</span></span>
                            <span class="checks">✓✓</span>
                        </div>
                    </div>
                    <div class="badge secondary-badge" style="background: #202c33; border: 1px solid rgba(255,255,255,0.2); color: #fff; transform: rotate(0deg); bottom: -5px; right: -5px; font-size: 0.7rem; padding: 2px 6px;">#${i + 2}</div>
                </div>
                `;
            }).join('');

            runnersUpHtml = `
            <div class="runners-up-wrapper" style="display: flex; gap: 10px; width: 90%; max-width: 450px; justify-content: center; align-items: stretch;">
                ${itemsHtml}
            </div>
            `;
        }

        return `
        <div class="content-wrapper most-frequent-msg-slide-content">
            <div class="intro">
                <h2>Mensajes que se repitieron hasta el cansancio...</h2>
            </div>

            <div class="messages-list" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                ${winnerHtml}
                ${runnersUpHtml}
            </div>
        </div>
        `;
    }

    onEnter(): void {
        const title = this.element?.querySelector(".intro h2");
        const winner = this.element?.querySelector(".message-container.winner");
        const runnersUp = this.element?.querySelectorAll(".message-container.runner-up");
        const badges = this.element?.querySelectorAll(".badge");

        const tl = gsap.timeline();

        if (title) {
            tl.fromTo(
                title,
                { y: -50, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.8 },
            );
        }

        if (winner) {
            tl.fromTo(
                winner,
                { y: 50, autoAlpha: 0, scale: 0.8 },
                {
                    y: 0,
                    autoAlpha: 1,
                    scale: 1,
                    duration: 0.8,
                    ease: "power3.out",
                },
                "-=0.4"
            );
        }

        if (runnersUp && runnersUp.length > 0) {
            tl.fromTo(
                runnersUp,
                { y: 30, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "power2.out",
                },
                "-=0.6"
            );
        }

        if (badges && badges.length > 0) {
            tl.fromTo(
                badges,
                { scale: 0, rotate: 180, autoAlpha: 0 },
                {
                    scale: 1,
                    rotate: (i) => i === 0 ? -10 : 0,
                    autoAlpha: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "back.out",
                },
                "-=0.4"
            );
        }
        
        this.timeline = tl;
    }

    onLeave(): void {
        this.killAnimations();
        const elements = this.element?.querySelectorAll(".intro h2, .message-container, .badge");
        if (elements) {
            gsap.set(elements, { autoAlpha: 0 });
        }
    }
}
