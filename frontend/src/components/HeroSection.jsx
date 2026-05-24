// HeroSection.jsx — Centered headline and subheadline with gradient text and staggered fade-in animation.

function HeroSection() {
  return (
    <div className="text-center">
      {/* Main headline */}
      <h1
        className="animate-fade-in-up delay-0 font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight text-gradient-hero"
      >
        Understand any codebase.
        <br />
        Instantly.
      </h1>

      {/* Subheadline */}
      <p
        className="animate-fade-in-up delay-100 mt-5 font-mono text-sm md:text-base leading-relaxed max-w-xl mx-auto"
        style={{ color: "var(--text-muted)", lineHeight: 1.7 }}
      >
        Paste a GitHub repo URL and get an interactive architecture map
        with AI-generated explanations.
      </p>
    </div>
  );
}

export default HeroSection;
