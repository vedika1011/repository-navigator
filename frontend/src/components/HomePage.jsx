// HomePage.jsx — Full page layout with loading state, graph visualization, and analysis summary.

import { useCallback } from "react";
import BackgroundCanvas from "./BackgroundCanvas.jsx";
import NavBar from "./NavBar.jsx";
import RepoInput from "./RepoInput.jsx";
import FeaturePills from "./FeaturePills.jsx";
import ResultsPlaceholder from "./ResultsPlaceholder.jsx";
import GraphView from "./GraphView.jsx";
import MiniGraphPreview from "./MiniGraphPreview.jsx";
import useAnalyze from "../hooks/useAnalyze.js";

function HomePage() {
  const { graphData, isLoading, error, analyze, lastRepoUrl, progressMessage } = useAnalyze();

  const handlePillClick = useCallback((targetId) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleNewAnalysis = useCallback(() => {
    sessionStorage.removeItem('reponav_last_result');
    sessionStorage.removeItem('reponav_last_url');
    window.location.reload();
  }, []);

  return (
    <div className="relative min-h-screen">
      <BackgroundCanvas />

      <div className="relative z-10">
        <NavBar isLoading={isLoading} graphData={graphData} onNewAnalysis={handleNewAnalysis} />

        <main className="pb-24 md:pb-32">
          
          {/* Pre-analysis layout (Two columns) */}
          {!graphData && !isLoading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '60px',
              alignItems: 'center',
              minHeight: 'calc(100vh - 80px)',
              padding: '60px 20px',
              maxWidth: '1200px',
              margin: '0 auto',
            }} className="md:grid-cols-[55fr_45fr] md:px-[60px] md:py-0">
              {/* LEFT: Hero content */}
              <div>
                <div className="hero-animate-1" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 20,
                  padding: '4px 14px',
                  marginBottom: 24,
                }}>
                  <span style={{
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: '#a78bfa',
                    display: 'inline-block',
                  }} />
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#a78bfa',
                    letterSpacing: '0.05em',
                  }}>
                    AI-POWERED CODE INTELLIGENCE
                  </span>
                </div>

                <h1 className="hero-animate-2" style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(40px, 5vw, 68px)',
                  lineHeight: 1.1,
                  color: '#e6edf3',
                  margin: '0 0 20px 0',
                  letterSpacing: '-0.02em',
                }}>
                  Understand any<br />
                  <span style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #58a6ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    codebase
                  </span>
                  {' '}instantly.
                </h1>

                <p className="hero-animate-3" style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 15,
                  color: '#8b949e',
                  lineHeight: 1.7,
                  margin: '0 0 36px 0',
                  maxWidth: 480,
                }}>
                  Paste a GitHub URL and get an interactive architecture map,
                  AI-generated file summaries, and a guided onboarding path
                  in under 60 seconds.
                </p>

                <div className="hero-animate-4">
                  <RepoInput
                    onAnalyze={analyze}
                    isLoading={isLoading}
                    backendError={error}
                    defaultValue={lastRepoUrl}
                    progressMessage={progressMessage}
                  />

                  <div className="mt-8">
                    <FeaturePills active={false} onPillClick={handlePillClick} />
                  </div>

                  <div style={{
                    marginTop: 28,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#3d444d',
                  }}>
                    Supports JS, TS, Python, Java, Go, Rust, Ruby, PHP, C/C++, Swift, Kotlin, Vue, Svelte and more
                  </div>
                </div>
              </div>

              {/* RIGHT: Preview card */}
              <div className="hidden md:block hero-animate-3">
                <MiniGraphPreview />
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && !graphData && (
            <div className="max-w-2xl mx-auto mt-24 px-5">
              <div
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "48px 32px",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  {progressMessage || 'Cloning repository and analyzing dependencies...'}
                </div>
              </div>
            </div>
          )}

          {/* Post-analysis layout (Single column) */}
          {graphData && (
            <div className="px-5 pt-12">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5">
                  <h2
                    className="font-display font-bold text-xl"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Architecture Graph
                  </h2>
                  <FeaturePills active={true} onPillClick={handlePillClick} />
                </div>
                
                <div id="section-graph" className="animate-fade-in-up">
                  <GraphView graphData={graphData} />
                </div>
              </div>

              <div className="max-w-2xl mx-auto mt-16">
                <div id="section-summary" className="animate-fade-in delay-200">
                  <h2
                    className="font-display font-bold text-xl mb-5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Analysis Summary
                  </h2>
                  <ResultsPlaceholder graphData={graphData} isLoading={isLoading} />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default HomePage;
