import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const homeCards = [
  {
    title: "Unified Intelligence Engine",
    body: "Connect analytics, forecasting, and content research into one strategic layer.",
  },
  {
    title: "Opportunity Detection",
    body: "Find high-momentum topic gaps where market demand is strong and overlap is low.",
  },
  {
    title: "Agentic Strategy Board",
    body: "Turn ML insights into creator-ready publishing and promotion action plans.",
  },
  {
    title: "Explainability Layer",
    body: "Every recommendation includes transparent mathematical reasoning and confidence.",
  },
];

export function HomePage() {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-enter", {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.utils.toArray(".scroll-reveal").forEach((item) => {
        gsap.from(item as Element, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item as Element,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className="mx-auto max-w-7xl px-4 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900/50 p-8">
        <div className="pointer-events-none absolute -left-14 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-12 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
        <p className="hero-enter text-xs uppercase tracking-[0.22em] text-cyan-300">
          Project Growth Engine
        </p>
        <h1 className="hero-enter max-w-3xl text-4xl font-bold text-white md:text-6xl">
          Unified Autonomous Intelligence for YouTube Creator Growth
        </h1>
        <p className="hero-enter mt-4 max-w-2xl text-slate-300">
          We combine FastAPI pipelines, ML forecasting, NLP clustering, and explainable AI
          to provide predictive, actionable, and interpretable creator strategy.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {homeCards.map((card, idx) => (
          <motion.article
            key={card.title}
            className="scroll-reveal glass-panel p-5"
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
              Module 0{idx + 1}
            </p>
            <h3 className="text-xl font-semibold text-slate-100">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{card.body}</p>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
