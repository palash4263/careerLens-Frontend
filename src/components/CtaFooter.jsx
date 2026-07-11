import React, { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import "./CtaFooter.css";

const CtaFooter = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

    const initHls = (HlsClass) => {
      const hls = new HlsClass();
      hls.loadSource(src);
      hls.attachMedia(video);
      return hls;
    };

    let hlsInstance = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari, iOS)
      video.src = src;
    } else {
      // Fallback: load HLS.js from CDN dynamically to prevent compile-time dependency errors
      if (window.Hls) {
        hlsInstance = initHls(window.Hls);
      } else {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.10/dist/hls.min.js";
        script.async = true;
        script.onload = () => {
          if (window.Hls) {
            hlsInstance = initHls(window.Hls);
          }
        };
        document.body.appendChild(script);

        return () => {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      }
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, []);

  return (
    <section className="cta-section">
      {/* Background HLS Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="cta-video"
      />

      {/* Top fade */}
      <div className="cta-fade-top" />
      {/* Bottom fade */}
      <div className="cta-fade-bottom" />

      {/* Content */}
      <div className="cta-content">
        <h2 className="cta-heading">
          Your next career leap starts here.
        </h2>
        <p className="cta-subtext">
          Optimize your resume for ATS, scan requirements, and ace mock interviews with AI-powered career intelligence.
        </p>
        <div className="cta-btn-row">
          <button 
            className="liquid-glass-strong"
            onClick={() => window.open("/resumes", "_self")}
          >
            Optimize Resume
            <ArrowUpRight style={{ width: '18px', height: '18px' }} />
          </button>
          <button 
            className="cta-btn-solid"
            onClick={() => window.open("/interview", "_self")}
          >
            Practice Interview
            <ArrowUpRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default CtaFooter;
