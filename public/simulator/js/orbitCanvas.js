/* Satellite QKD Simulator - Clean Full Round Earth 3D/2D Canvas Visualizer */

class OrbitCanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.satelliteAngle = -Math.PI * 0.5;
    this.satelliteSpeed = 0.005;
    this.earthRotationAngle = 0;
    
    this.isEvePresent = false;
    this.selectedEveLink = 1;

    // Sender & Receiver angles on globe (radians)
    this.senderAngle = -Math.PI * 0.72; // Left side of globe
    this.receiverAngle = -Math.PI * 0.28; // Right side of globe
    this.senderName = "Delhi Master Hub";
    this.receiverName = "Bengaluru Quantum Lab";
    
    this.photons = [];
    this.stars = [];
    
    this.initCanvasSize();
    this.createStarfield();
    window.addEventListener('resize', () => this.initCanvasSize());
  }

  initCanvasSize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    this.width = rect.width > 50 ? rect.width : 900;
    this.height = rect.height > 50 ? rect.height : 580;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  createStarfield() {
    this.stars = [];
    for (let i = 0; i < 220; i++) {
      this.stars.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  startAnimationLoop() {
    const animate = () => {
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }

  setStations(senderAngle, receiverAngle, senderName, receiverName) {
    if (senderAngle !== undefined) this.senderAngle = senderAngle;
    if (receiverAngle !== undefined) this.receiverAngle = receiverAngle;
    if (senderName) this.senderName = senderName;
    if (receiverName) this.receiverName = receiverName;
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Deep Space Background
    ctx.fillStyle = '#030612';
    ctx.fillRect(0, 0, w, h);

    // 1. Twinkling Starfield
    ctx.fillStyle = '#ffffff';
    this.stars.forEach(star => {
      star.alpha += (Math.random() - 0.5) * 0.03;
      star.alpha = Math.max(0.15, Math.min(0.85, star.alpha));
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Center coordinates for FULL ROUND EARTH
    const centerX = w * 0.5;
    const centerY = h * 0.52;
    const minDim = Math.min(w, h);

    // Radii
    const earthRadius = minDim * 0.28;
    const hapRadius = earthRadius + minDim * 0.07; // ~20km scale
    const orbitRadius = earthRadius + minDim * 0.18; // ~500km LEO orbit

    this.earthRotationAngle += 0.001;

    // 2. Stratospheric & Atmospheric Outer Glow Ring (Full Circle)
    const atmosGrad = ctx.createRadialGradient(
      centerX, centerY, earthRadius * 0.98,
      centerX, centerY, earthRadius * 1.25
    );
    atmosGrad.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
    atmosGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.2)');
    atmosGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.08)');
    atmosGrad.addColorStop(1, 'rgba(3, 6, 18, 0)');

    ctx.fillStyle = atmosGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // 3. CLEAN FULL ROUND EARTH GLOBE
    const earthGrad = ctx.createRadialGradient(
      centerX - earthRadius * 0.35, centerY - earthRadius * 0.35, earthRadius * 0.1,
      centerX, centerY, earthRadius
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
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating Grid Lines on Globe (Clean & High Tech)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.clip();

    // Latitude rings
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 0.25; r < 0.95; r += 0.22) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, earthRadius * r, earthRadius * r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Longitude meridian curves
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    for (let i = 0; i < 6; i++) {
      const angle = this.earthRotationAngle + (i * Math.PI) / 3;
      const widthFactor = Math.sin(angle);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.abs(earthRadius * widthFactor), earthRadius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // 4. Stratosphere Ring & Orbital Track Ring
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

    // 5. NODE POSITIONS

    // Sender Ground Station A (Alice)
    const gAX = centerX + Math.cos(this.senderAngle) * earthRadius;
    const gAY = centerY + Math.sin(this.senderAngle) * earthRadius;

    // Receiver Ground Station B (Bob)
    const gBX = centerX + Math.cos(this.receiverAngle) * earthRadius;
    const gBY = centerY + Math.sin(this.receiverAngle) * earthRadius;

    // Stratospheric HAP Relay (Positioned between Sender & Receiver at Stratosphere height)
    const midAngleHap = (this.senderAngle + this.receiverAngle) * 0.5 + 0.15;
    const hapX = centerX + Math.cos(midAngleHap) * hapRadius;
    const hapY = centerY + Math.sin(midAngleHap) * hapRadius;

    // LEO Satellite (Orbital motion along orbit ring)
    this.satelliteAngle += this.satelliteSpeed;
    const satX = centerX + Math.cos(this.satelliteAngle) * orbitRadius;
    const satY = centerY + Math.sin(this.satelliteAngle) * orbitRadius;

    // 6. Draw 3 Free-Space Optical Laser Links
    // Link 1: Sender (Ground A) -> LEO Satellite
    this.drawOpticalLink(ctx, gAX, gAY, satX, satY, "LINK 1: Uplink (Sender → LEO Sat)", this.isEvePresent && this.selectedEveLink === 1, '#00f3ff');

    // Link 2: LEO Satellite -> HAP Relay
    this.drawOpticalLink(ctx, satX, satY, hapX, hapY, "LINK 2: Inter-Node (Sat → HAP)", this.isEvePresent && this.selectedEveLink === 2, '#a855f7');

    // Link 3: HAP Relay -> Receiver (Ground B)
    this.drawOpticalLink(ctx, hapX, hapY, gBX, gBY, "LINK 3: Downlink (HAP → Receiver)", this.isEvePresent && this.selectedEveLink === 3, '#10b981');

    // 7. Photon Pulse Animations
    if (Math.random() < 0.4) {
      this.photons.push({
        hop: 1,
        progress: 0,
        speed: 0.035 + Math.random() * 0.015,
        state: ['↑', '→', '↗', '↖'][Math.floor(Math.random() * 4)]
      });
    }

    ctx.font = '700 11px "JetBrains Mono", monospace';
    this.photons.forEach((p, idx) => {
      p.progress += p.speed;

      let startX, startY, endX, endY;
      if (p.hop === 1) {
        startX = gAX; startY = gAY; endX = satX; endY = satY;
      } else if (p.hop === 2) {
        startX = satX; startY = satY; endX = hapX; endY = hapY;
      } else {
        startX = hapX; startY = hapY; endX = gBX; endY = gBY;
      }

      if (p.progress >= 1.0) {
        if (p.hop < 3) {
          p.hop += 1;
          p.progress = 0;
        } else {
          this.photons.splice(idx, 1);
          if (window.qkdAudio) window.qkdAudio.playLaserPulse();
          return;
        }
      }

      const px = startX + (endX - startX) * p.progress;
      const py = startY + (endY - startY) * p.progress;
      const isCorrupted = this.isEvePresent && this.selectedEveLink === p.hop && p.progress > 0.4;

      ctx.fillStyle = isCorrupted ? '#ef4444' : '#00f3ff';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isCorrupted ? '#ef4444' : '#ffffff';
      ctx.fillText(p.state, px + 7, py - 4);
    });

    // 8. RENDER HIGH-VISIBILITY PROMINENT NODES & LABELS

    // Ground Station A (Sender / Alice)
    this.drawGroundStationNode(ctx, gAX, gAY, `SENDER (Ground A)`, this.senderName, "#00f3ff", true);

    // Ground Station B (Receiver / Bob)
    this.drawGroundStationNode(ctx, gBX, gBY, `RECEIVER (Ground B)`, this.receiverName, "#10b981", false);

    // Stratospheric HAP Relay (High-Altitude Platform)
    this.drawHapAirshipNode(ctx, hapX, hapY, "STRATOSPHERIC HAP RELAY", "Trusted HAP Node (20km)");

    // LEO Satellite (Prominent Orbiting Satellite)
    this.drawProminentSatelliteNode(ctx, satX, satY, "LEO SATELLITE", "NQM Quantum-Sat 1 (500km)");
  }

  drawOpticalLink(ctx, x1, y1, x2, y2, label, isEve, defaultColor) {
    const beamColor = isEve ? 'rgba(239, 68, 68, 0.95)' : defaultColor;
    const beamGlow = isEve ? 'rgba(239, 68, 68, 0.3)' : defaultColor.replace('1)', '0.25)').replace('#00f3ff', 'rgba(0,243,255,0.25)').replace('#a855f7', 'rgba(168,85,247,0.25)').replace('#10b981', 'rgba(16,185,129,0.25)');

    ctx.strokeStyle = beamGlow;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Link label at midpoint
    const midX = (x1 + x2) * 0.5;
    const midY = (y1 + y2) * 0.5;

    ctx.fillStyle = 'rgba(6, 9, 19, 0.9)';
    ctx.fillRect(midX - 65, midY - 11, 130, 22);
    ctx.strokeStyle = isEve ? '#ef4444' : beamColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 65, midY - 11, 130, 22);

    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = isEve ? '#ef4444' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(isEve ? "⚠ EVE INTERCEPT ACTIVE" : label, midX, midY + 4);
    ctx.textAlign = 'left';
  }

  drawGroundStationNode(ctx, x, y, title, subtitle, color, isLeft) {
    // Pulse ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Ground dish icon
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 6, 8, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();

    const offsetX = isLeft ? -150 : 20;
    const offsetY = -15;

    ctx.fillStyle = 'rgba(6, 9, 19, 0.92)';
    ctx.fillRect(x + offsetX, y + offsetY, 140, 38);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + offsetX, y + offsetY, 140, 38);

    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, x + offsetX + 8, y + offsetY + 15);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.fillText(subtitle, x + offsetX + 8, y + offsetY + 29);
  }

  drawHapAirshipNode(ctx, x, y, title, subtitle) {
    // HAP Airship body
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(x, y, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gondola
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - 5, y + 10, 10, 5);

    // Label card
    ctx.fillStyle = 'rgba(6, 9, 19, 0.92)';
    ctx.fillRect(x + 25, y - 18, 155, 38);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 25, y - 18, 155, 38);

    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, x + 33, y - 4);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(subtitle, x + 33, y + 10);
  }

  drawProminentSatelliteNode(ctx, x, y, title, subtitle) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing Halo around Satellite
    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
    haloGrad.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
    haloGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    // Solar Wings
    ctx.fillStyle = '#a855f7';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;

    ctx.fillRect(-26, -5, 15, 10);
    ctx.strokeRect(-26, -5, 15, 10);

    ctx.fillRect(11, -5, 15, 10);
    ctx.strokeRect(11, -5, 15, 10);

    // Satellite Chassis Body
    ctx.fillStyle = '#0a0f24';
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -9, 18, 18);

    // Transmitter Lens
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Satellite Floating Label Card
    ctx.fillStyle = 'rgba(6, 9, 19, 0.95)';
    ctx.fillRect(x - 80, y - 52, 160, 38);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 80, y - 52, 160, 38);

    ctx.font = '800 11px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(title, x, y - 37);

    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f3ff';
    ctx.fillText(subtitle, x, y - 23);
    ctx.textAlign = 'left';
  }
}

window.OrbitCanvasRenderer = OrbitCanvasRenderer;
