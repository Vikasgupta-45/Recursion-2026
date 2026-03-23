import { useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HomePage() {
  const pageRef = useRef<HTMLElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const horizontalPanelRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!pageRef.current || !marqueeRef.current || !horizontalRef.current || !horizontalPanelRef.current) return;
    
    // Create a context so we can cleanly revert GSAP on unmount
    const ctx = gsap.context(() => {
      // 1. Marquee infinite animation
      gsap.to(".marquee-track", {
        xPercent: -50,
        duration: 20,
        ease: "linear",
        repeat: -1,
      });

      // 2. Hero Text stagger reveal
      gsap.from(".hero-fade", {
        opacity: 0,
        y: 80,
        rotationX: -45,
        duration: 1.2,
        stagger: 0.15,
        ease: "power3.out",
        transformOrigin: "center bottom"
      });

      // 3. Hero Parallax
      gsap.to(".hero-parallax", {
        yPercent: -30,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // 4. Horizontal Scroll Section
      const panels = gsap.utils.toArray(".horizontal-panel");
      
      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: horizontalRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          start: "top top",
          end: () => "+=" + (window.innerWidth * panels.length),
        }
      });

      // 5. Card Reveal
      gsap.utils.toArray(".reveal-card").forEach((element) => {
        gsap.from(element as Element, {
          opacity: 0,
          y: 48,
          scale: 0.98,
          duration: 0.9,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: element as Element,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // 6. Deliverable Cards Stagger
      gsap.utils.toArray(".deliverable-item").forEach((element, index) => {
        gsap.from(element as Element, {
          opacity: 0,
          y: 60,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".deliverables",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="home" ref={pageRef}>
      <motion.section
        className="hero"
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div style={{ perspective: "1000px" }}>
          <p className="eyebrow hero-fade hero-parallax">
            Unified Autonomous System
          </p>
          <h1 className="hero-fade hero-parallax mega-text-reveal">
            Build once.<br/>
            <span style={{color: "var(--accent)"}}>Analyze everything.</span><br/>
            Grow intelligently.
          </h1>
          <p className="hero-fade">
            A single intelligence layer that combines analytics, optimization, promotion,
            and strategy into one coherent action plan for creators.
          </p>
        </div>
      </motion.section>

      <section className="grid-2" style={{ padding: "0 5vw" }}>
        <article className="card reveal-card">
          <h3 style={{ color: "var(--accent)"}}>The Core Problem</h3>
          <p>Fragmented tool ecosystem and disconnected insights.</p>
          <p>Limited strategic clarity on what works and why.</p>
          <p>Reactive decision-making instead of predictive planning.</p>
        </article>
        <article className="card reveal-card">
          <h3 style={{ color: "var(--accent-2)"}}>Paradigm Shift</h3>
          <p>Centralized intelligence for content growth decisions.</p>
          <p>Integrated, actionable recommendations.</p>
          <p>Predictive and automated growth strategy cycles.</p>
        </article>
      </section>

      {/* Horizontal Scroll Section */}
      <section className="horizontal-scroll-section" ref={horizontalRef}>
        <div className="horizontal-container" ref={horizontalPanelRef}>
          <div className="horizontal-panel">
            <div className="panel-content">
              <h2>01. Analyze</h2>
              <h3>The Intelligence Engine</h3>
              <p>
                Dynamic channel metrics and forecasting. Our backend predicts your 60-day 
                trajectory using Prophet models, blending historical data seamlessly into future trends. 
                A Feature Importance matrix reveals exactly which variables mathematically drive your views.
              </p>
              <div className="mock-ui">
                <div className="mock-chart">
                  <div className="line-solid"></div>
                  <div className="line-dotted"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="horizontal-panel">
            <div className="panel-content">
              <h2>02. Detect</h2>
              <h3>Opportunity Gap Detector</h3>
              <p>
                Visual heatmaps map your video history against global market trends to find 
                "High-Value Content Gaps"—topics with massive market momentum but less than 
                15% overlap with your current catalog. Stop guessing, start capturing demand.
              </p>
              <div className="mock-ui gap-alerts">
                <span className="badge">High-Value Gap Detected</span>
                <span className="badge">Trending Keyword</span>
              </div>
            </div>
          </div>

          <div className="horizontal-panel">
            <div className="panel-content">
              <h2>03. Strategize</h2>
              <h3>Agentic Strategy Board</h3>
              <p>
                This isn't an Excel sheet. This is an intelligent command center. 
                Our LLM research agents automatically consume your analytics and market gaps 
                to generate highly-targeted, data-backed content ideas tailored specifically to your audience.
              </p>
              <div className="mock-ui commands">
                <div className="cmd-line">Agent generating ideas...</div>
                <div className="cmd-line success">3 High-probability concepts found.</div>
              </div>
            </div>
          </div>

          <div className="horizontal-panel">
            <div className="panel-content">
              <h2>04. Explain</h2>
              <h3>The Explainability Engine</h3>
              <p>
                Solving the 'Black Box' AI problem. Every recommendation comes with mathematical 
                reasoning. Example: <em>"Recommendation: Upload on Sunday. Math: Historical data 
                shows engagement is 30% higher on weekends for your niche."</em>
              </p>
              <div className="mock-ui clear-box">
                <p><strong>Reasoning:</strong> p-value &lt; 0.05 on weekend CTRs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marquee" ref={marqueeRef}>
        <div className="marquee-track">
          <span>Unified Autonomous Growth Intelligence</span>
          <span>Predictive Strategy Engine</span>
          <span>Channel Intelligence Engine</span>
          <span>Opportunity Detection Module</span>
          <span>Unified Autonomous Growth Intelligence</span>
          <span>Predictive Strategy Engine</span>
        </div>
      </section>

      <section className="card deliverables reveal-card" style={{ margin: "0 5vw 100px 5vw" }}>
        <h3>Hackathon Deliverables</h3>
        <div className="deliverable-grid">
          <motion.div className="deliverable-item">
            <h4>1. Channel Intelligence</h4>
            <p>Analyze content performance and audience behavior from real inputs.</p>
          </motion.div>
          <motion.div className="deliverable-item">
            <h4>2. Opportunity Detection</h4>
            <p>Detect trends, gaps, and untapped potential with coherent logic.</p>
          </motion.div>
          <motion.div className="deliverable-item">
            <h4>3. Strategy Engine</h4>
            <p>Recommend content, timing, and promotion with clear rationale.</p>
          </motion.div>
          <motion.div className="deliverable-item">
            <h4>4. Unified Interface</h4>
            <p>Present all insights in a single interpretable platform.</p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
