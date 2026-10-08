import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Satellite,
  Radio,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Compass,
  MapPin
} from 'lucide-react';

export interface GroundStationTarget {
  id?: string;
  name: string;
  lat: number;
  lon: number;
  angle: number; // Position on 2D/3D earth circle
}

export const STATION_DATABASE: Record<string, GroundStationTarget> = {
  amaravati: { name: 'Amaravati Quantum Communication Station', lat: 16.7000, lon: 80.4700, angle: -Math.PI * 0.33 },
  delhi: { name: 'Delhi Master Hub', lat: 28.6139, lon: 77.2090, angle: -Math.PI * 0.72 },
  bengaluru: { name: 'Bengaluru Quantum Lab', lat: 12.9716, lon: 77.5946, angle: -Math.PI * 0.28 },
  rayalaseema: { name: 'Rayalaseema OGS (NASA Dataset 14°N, 78°E)', lat: 14.0000, lon: 78.0000, angle: -Math.PI * 0.35 },
  mumbai: { name: 'Mumbai Optical Node', lat: 19.0760, lon: 72.8777, angle: -Math.PI * 0.45 },
  london: { name: 'London European Relay', lat: 51.5074, lon: -0.1278, angle: -Math.PI * 0.88 },
  munich: { name: 'Munich Optical Hub', lat: 48.1351, lon: 11.5820, angle: -Math.PI * 0.80 },
  tokyo: { name: 'Tokyo Asia-Pacific Node', lat: 35.6762, lon: 139.6503, angle: -Math.PI * 0.12 },
  singapore: { name: 'Singapore Relay Station', lat: 1.3521, lon: 103.8198, angle: -Math.PI * 0.20 },
  washington: { name: 'Washington D.C. Node', lat: 38.9072, lon: -77.0369, angle: -Math.PI * 0.95 }
};

interface Photon {
  hop: 1 | 2 | 3;
  progress: number;
  speed: number;
  state: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

interface Props {
  className?: string;
  showStationSelectors?: boolean;
  defaultSender?: string;
  defaultReceiver?: string;
}

export const NqmLiveVisualizer: React.FC<Props> = ({
  className = '',
  showStationSelectors = true,
  defaultSender = 'delhi',
  defaultReceiver = 'bengaluru'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Station selection state
  const [senderKey, setSenderKey] = useState<string>(defaultSender);
  const [receiverKey, setReceiverKey] = useState<string>(defaultReceiver);

  // Eve Interception state
  const [isEvePresent, setIsEvePresent] = useState<boolean>(false);
  const [selectedEveLink, setSelectedEveLink] = useState<number>(1);

  // Animation controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Great Circle Distance calculation (Haversine)
  const stationA = STATION_DATABASE[senderKey] || STATION_DATABASE.delhi;
  const stationB = STATION_DATABASE[receiverKey] || STATION_DATABASE.bengaluru;

  const geoDistanceKm = useMemo(() => {
    const R = 6371;
    const dLat = ((stationB.lat - stationA.lat) * Math.PI) / 180;
    const dLon = ((stationB.lon - stationA.lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((stationA.lat * Math.PI) / 180) *
        Math.cos((stationB.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [stationA, stationB]);

  // Slant ranges based on geo distance
  const link1Dist = Math.round(Math.sqrt(500 ** 2 + (geoDistanceKm * 0.4) ** 2));
  const link2Dist = Math.round(Math.sqrt(480 ** 2 + (geoDistanceKm * 0.35) ** 2));
  const link3Dist = 30; // 20km altitude slant to ground

  // Computed QBER & SKR metrics (NQM Physics formulas)
  const qberVal = isEvePresent ? (24.8 + Math.random() * 0.4).toFixed(2) : (2.15 + (link1Dist / 1200) * 0.5).toFixed(2);
  const skrVal = isEvePresent ? '0.00' : Math.max(12.0, (168 - link1Dist * 0.08)).toFixed(2);
  const totalLossDb = (10.9 + (link1Dist - 500) * 0.01 + 6.6 + 3.5).toFixed(1);
  const totalDelayMs = ((link1Dist + link2Dist + link3Dist) / 299.792 + 1.0).toFixed(2);

  // Audio Synth via Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (type: 'laser' | 'sift' | 'alert') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'laser') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Ignore audio failure
    }
  };

  // Canvas Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let satelliteAngle = -Math.PI * 0.5;
    const satelliteSpeed = 0.004;
    let earthRotationAngle = 0;

    const photons: Photon[] = [];
    const stars: Star[] = [];

    // Initialize Starfield
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    const render = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.max(320, Math.floor(rect.width));
        const targetH = Math.max(380, Math.floor(rect.height || 540));

        if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
          canvas.width = targetW * dpr;
          canvas.height = targetH * dpr;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }
      }

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // 1. Deep Space Background
      ctx.fillStyle = '#030612';
      ctx.fillRect(0, 0, w, h);

      // 2. Twinkling Stars
      ctx.fillStyle = '#ffffff';
      stars.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * 0.03;
        star.alpha = Math.max(0.15, Math.min(0.85, star.alpha));
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Center Geometry for Full Round Earth
      const centerX = w * 0.5;
      const centerY = h * 0.52;
      const minDim = Math.min(w, h);

      const earthRadius = minDim * 0.28;
      const hapRadius = earthRadius + minDim * 0.07; // ~20 km scale
      const orbitRadius = earthRadius + minDim * 0.18; // ~500 km LEO orbit

      if (isPlaying) {
        earthRotationAngle += 0.001;
        satelliteAngle += satelliteSpeed;
      }

      // Atmospheric Outer Glow
      const atmosGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        earthRadius * 0.98,
        centerX,
        centerY,
        earthRadius * 1.25
      );
      atmosGrad.addColorStop(0, 'rgba(0, 243, 255, 0.45)');
      atmosGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.18)');
      atmosGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.07)');
      atmosGrad.addColorStop(1, 'rgba(3, 6, 18, 0)');

      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Full Round Earth Globe
      const earthGrad = ctx.createRadialGradient(
        centerX - earthRadius * 0.35,
        centerY - earthRadius * 0.35,
        earthRadius * 0.1,
        centerX,
        centerY,
        earthRadius
      );
      earthGrad.addColorStop(0, '#1d3b7a');
      earthGrad.addColorStop(0.55, '#0e1a38');
      earthGrad.addColorStop(0.88, '#080d1e');
      earthGrad.addColorStop(1, '#030612');

      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Latitude / Longitude Grid Lines
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let r = 0.25; r < 0.95; r += 0.22) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, earthRadius * r, earthRadius * r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      for (let i = 0; i < 6; i++) {
        const angle = earthRotationAngle + (i * Math.PI) / 3;
        const widthFactor = Math.sin(angle);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(earthRadius * widthFactor), earthRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Orbit Track Rings
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, hapRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Node Coordinates
      const gAX = centerX + Math.cos(stationA.angle) * earthRadius;
      const gAY = centerY + Math.sin(stationA.angle) * earthRadius;

      const gBX = centerX + Math.cos(stationB.angle) * earthRadius;
      const gBY = centerY + Math.sin(stationB.angle) * earthRadius;

      const midAngleHap = (stationA.angle + stationB.angle) * 0.5 + 0.15;
      const hapX = centerX + Math.cos(midAngleHap) * hapRadius;
      const hapY = centerY + Math.sin(midAngleHap) * hapRadius;

      const satX = centerX + Math.cos(satelliteAngle) * orbitRadius;
      const satY = centerY + Math.sin(satelliteAngle) * orbitRadius;

      // 5. Draw 3 Optical Laser Links
      drawOpticalLink(
        ctx,
        gAX,
        gAY,
        satX,
        satY,
        `LINK 1: Uplink (${link1Dist} km)`,
        isEvePresent && selectedEveLink === 1,
        '#00f3ff'
      );

      drawOpticalLink(
        ctx,
        satX,
        satY,
        hapX,
        hapY,
        `LINK 2: Inter-Node (${link2Dist} km)`,
        isEvePresent && selectedEveLink === 2,
        '#a855f7'
      );

      drawOpticalLink(
        ctx,
        hapX,
        hapY,
        gBX,
        gBY,
        `LINK 3: Downlink (${link3Dist} km)`,
        isEvePresent && selectedEveLink === 3,
        '#10b981'
      );

      // 6. Spawn Photons
      if (isPlaying && Math.random() < 0.35) {
        photons.push({
          hop: 1,
          progress: 0,
          speed: 0.035 + Math.random() * 0.015,
          state: ['↑', '→', '↗', '↖'][Math.floor(Math.random() * 4)]
        });
      }

      // Draw & Update Photons
      ctx.font = '700 11px "JetBrains Mono", monospace';
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        if (isPlaying) p.progress += p.speed;

        let startX = 0,
          startY = 0,
          endX = 0,
          endY = 0;
        if (p.hop === 1) {
          startX = gAX;
          startY = gAY;
          endX = satX;
          endY = satY;
        } else if (p.hop === 2) {
          startX = satX;
          startY = satY;
          endX = hapX;
          endY = hapY;
        } else {
          startX = hapX;
          startY = hapY;
          endX = gBX;
          endY = gBY;
        }

        if (p.progress >= 1.0) {
          if (p.hop < 3) {
            p.hop += 1;
            p.progress = 0;
          } else {
            photons.splice(i, 1);
            playTone('laser');
            continue;
          }
        }

        const px = startX + (endX - startX) * p.progress;
        const py = startY + (endY - startY) * p.progress;
        const isCorrupted = isEvePresent && selectedEveLink === p.hop && p.progress > 0.4;

        ctx.fillStyle = isCorrupted ? '#ef4444' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isCorrupted ? '#ef4444' : '#ffffff';
        ctx.fillText(p.state, px + 7, py - 4);
      }

      // 7. Render Prominent Nodes
      // Ground Station A (Alice)
      drawGroundStation(ctx, gAX, gAY, 'SENDER (Ground A)', stationA.name, '#00f3ff', true);

      // Ground Station B (Bob)
      drawGroundStation(ctx, gBX, gBY, 'RECEIVER (Ground B)', stationB.name, '#10b981', false);

      // Stratospheric HAP Relay
      drawHapAirship(ctx, hapX, hapY, 'STRATOSPHERIC HAP RELAY', 'Trusted HAP Node (20 km)');

      // LEO Satellite
      drawSatelliteNode(ctx, satX, satY, 'LEO SATELLITE', 'NQM Quantum-Sat 1 (500 km)');

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isEvePresent, selectedEveLink, stationA, stationB, link1Dist, link2Dist, link3Dist]);

  const drawOpticalLink = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    isEve: boolean,
    defaultColor: string
  ) => {
    const beamColor = isEve ? 'rgba(239, 68, 68, 0.95)' : defaultColor;
    const beamGlow = isEve ? 'rgba(239, 68, 68, 0.3)' : defaultColor + '40';

    ctx.strokeStyle = beamGlow;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const midX = (x1 + x2) * 0.5;
    const midY = (y1 + y2) * 0.5;

    ctx.fillStyle = 'rgba(6, 9, 19, 0.92)';
    ctx.fillRect(midX - 70, midY - 11, 140, 22);
    ctx.strokeStyle = isEve ? '#ef4444' : beamColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 70, midY - 11, 140, 22);

    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isEve ? '#ef4444' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(isEve ? '⚠ EVE INTERCEPT ACTIVE' : label, midX, midY + 4);
    ctx.textAlign = 'left';
  };

  const drawGroundStation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    title: string,
    subtitle: string,
    color: string,
    isLeft: boolean
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const offsetX = isLeft ? -150 : 20;
    const offsetY = -15;

    ctx.fillStyle = 'rgba(6, 9, 19, 0.92)';
    ctx.fillRect(x + offsetX, y + offsetY, 140, 36);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + offsetX, y + offsetY, 140, 36);

    ctx.font = '700 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, x + offsetX + 8, y + offsetY + 14);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.fillText(subtitle, x + offsetX + 8, y + offsetY + 28);
  };

  const drawHapAirship = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    title: string,
    subtitle: string
  ) => {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - 5, y + 8, 10, 4);

    ctx.fillStyle = 'rgba(6, 9, 19, 0.92)';
    ctx.fillRect(x + 22, y - 18, 150, 36);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 22, y - 18, 150, 36);

    ctx.font = '700 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, x + 28, y - 4);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(subtitle, x + 28, y + 10);
  };

  const drawSatelliteNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    title: string,
    subtitle: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
    haloGrad.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
    haloGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a855f7';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.fillRect(-24, -5, 14, 10);
    ctx.strokeRect(-24, -5, 14, 10);
    ctx.fillRect(10, -5, 14, 10);
    ctx.strokeRect(10, -5, 14, 10);

    ctx.fillStyle = '#0a0f24';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 16);

    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(6, 9, 19, 0.95)';
    ctx.fillRect(x - 75, y - 50, 150, 36);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 75, y - 50, 150, 36);

    ctx.font = '800 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(title, x, y - 36);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.fillText(subtitle, x, y - 22);
    ctx.textAlign = 'left';
  };

  return (
    <div className={`bg-[#030612] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col ${className}`}>
      {/* Visualizer Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/95 border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                NQM LIVE ORBITAL &amp; RELAY QUANTUM LINK VISUALIZER
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live 60 FPS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Full Earth 3D/2D Projection • Alice (Ground A) → LEO Satellite (500 km) → Stratospheric HAP Relay (20 km) → Bob (Ground B)
            </p>
          </div>
        </div>

        {/* Quick Top Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
            className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[11px]">{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="text-[11px]">{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isEvePresent}
              onChange={(e) => {
                setIsEvePresent(e.target.checked);
                if (e.target.checked) playTone('alert');
              }}
              className="accent-rose-500 rounded cursor-pointer"
            />
            {isEvePresent ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="font-semibold text-[11px]">Simulate Eve</span>
          </label>

          {isEvePresent && (
            <select
              value={selectedEveLink}
              onChange={(e) => setSelectedEveLink(Number(e.target.value))}
              className="bg-slate-900 border border-rose-500/50 text-rose-300 rounded-lg px-2 py-1 text-xs font-mono outline-none"
            >
              <option value={1}>Link 1 (Alice→Sat)</option>
              <option value={2}>Link 2 (Sat→HAP)</option>
              <option value={3}>Link 3 (HAP→Bob)</option>
            </select>
          )}
        </div>
      </div>

      {/* Station Selector Bar (if enabled) */}
      {showStationSelectors && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 border-b border-slate-800/80 p-3 text-xs">
          <div>
            <label className="font-mono text-[11px] text-cyan-400 font-bold block mb-1">
              SENDER (Alice / Ground Station A):
            </label>
            <select
              value={senderKey}
              onChange={(e) => setSenderKey(e.target.value)}
              className="w-full bg-slate-900 border border-cyan-500/50 text-slate-200 rounded-md px-2.5 py-1 font-mono text-xs outline-none"
            >
              {Object.entries(STATION_DATABASE).map(([key, st]) => (
                <option key={key} value={key}>
                  {st.name} ({st.lat.toFixed(1)}°N, {st.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-[11px] text-emerald-400 font-bold block mb-1">
              RECEIVER (Bob / Ground Station B):
            </label>
            <select
              value={receiverKey}
              onChange={(e) => setReceiverKey(e.target.value)}
              className="w-full bg-slate-900 border border-emerald-500/50 text-slate-200 rounded-md px-2.5 py-1 font-mono text-xs outline-none"
            >
              {Object.entries(STATION_DATABASE).map(([key, st]) => (
                <option key={key} value={key}>
                  {st.name} ({st.lat.toFixed(1)}°N, {st.lon.toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end bg-slate-900/60 rounded-md p-2 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono">Great-Circle Baseline Distance:</span>
            <div className="font-mono text-sm font-bold text-purple-400">
              {geoDistanceKm.toLocaleString()} km
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div className="relative w-full h-[520px] bg-[#030612] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Telemetry HUD Overlay in Bottom-Right */}
        <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-lg pointer-events-none text-xs font-mono space-y-1">
          <div className="flex items-center justify-between gap-4 text-slate-400 text-[10px]">
            <span>PHYSICAL ENGINE:</span>
            <span className="text-cyan-400 font-bold">NQM 3-Hop Active</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Effective QBER:</span>
            <span className={`font-bold ${isEvePresent ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
              {qberVal}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">End-to-End SKR:</span>
            <span className={`font-bold ${isEvePresent ? 'text-rose-400' : 'text-emerald-400'}`}>
              {skrVal} kbps
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Total Optical Loss:</span>
            <span className="font-bold text-purple-400">{totalLossDb} dB</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">End-to-End Delay:</span>
            <span className="font-bold text-amber-400">{totalDelayMs} ms</span>
          </div>
          <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-4 text-[10px]">
            <span className="text-slate-400">SECURITY STATUS:</span>
            <span className={isEvePresent ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isEvePresent ? 'COMPROMISED / EVE DETECTED' : 'UNCONDITIONALLY SECURE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
