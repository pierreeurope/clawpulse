"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

interface Agent {
  username: string;
  agentName: string;
  lat: number;
  lng: number;
  lastPushedAt: string;
  totalTokens: number;
}

interface PulseGlobeProps {
  agents: Agent[];
}

export default function PulseGlobe({ agents }: PulseGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    // Calculate marker size and color based on recency
    const now = Date.now();
    const markers = agents.map((agent) => {
      const lastPushed = new Date(agent.lastPushedAt).getTime();
      const ageMs = now - lastPushed;
      const ageHours = ageMs / (1000 * 60 * 60);

      // Bright pulse for agents active in the last hour
      // Subtle glow for agents active in the last 24 hours
      // Dim for older activity
      let size = 0.03;
      let color: [number, number, number] = [0.345, 0.651, 1]; // #58a6ff blue

      if (ageHours < 1) {
        // Recently active - bright and large with pulse
        size = 0.08 + Math.sin(Date.now() / 200) * 0.02;
        color = [0.4, 0.8, 1]; // Brighter blue
      } else if (ageHours < 24) {
        // Active today - medium glow
        size = 0.05;
        color = [0.345, 0.651, 1];
      } else if (ageHours < 24 * 7) {
        // Active this week - subtle
        size = 0.04;
        color = [0.25, 0.5, 0.8];
      } else {
        // Older - dim
        size = 0.03;
        color = [0.15, 0.3, 0.5];
      }

      return {
        location: [agent.lat, agent.lng] as [number, number],
        size,
      };
    });

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.05, 0.05, 0.12], // Very dark blue background
      markerColor: [0.345, 0.651, 1], // GitHub blue #58a6ff
      glowColor: [0.05, 0.05, 0.15], // Dark glow
      markers,
      onRender: (state) => {
        // Slow auto-rotation
        state.phi = phi;
        phi += 0.003;

        // Update size based on width
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [agents]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: 600,
          aspectRatio: "1",
          margin: "0 auto",
          display: "block",
        }}
      />
    </div>
  );
}
