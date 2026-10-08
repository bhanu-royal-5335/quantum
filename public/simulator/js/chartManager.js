/* Satellite QKD Simulator - Relay-Aware Chart & Performance Loss Manager */

class QKDChartManager {
  constructor() {
    this.charts = {};
  }

  destroyChart(chartId) {
    if (this.charts[chartId]) {
      try {
        this.charts[chartId].destroy();
        delete this.charts[chartId];
      } catch (e) {
        console.warn(`Chart destroy warning for ${chartId}:`, e);
      }
    }
  }

  /**
   * Main Loss vs Distance Chart (Direct Link vs Relay-Assisted Link)
   */
  initMainRangeLossChart(canvasId = 'rangeLossChart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.destroyChart(canvasId);

    const distances = [];
    const directRates = [];
    const relayRates = [];

    for (let d = 100; d <= 2000; d += 100) {
      distances.push(`${d} km`);
      const direct = window.qkdPhysics.calculateSingleLink({ distanceKm: d, isFreeSpaceUpper: false });
      const relay = window.qkdPhysics.calculateComprehensivePhysics({ dist1: d * 0.5, dist2: d * 0.45, dist3: d * 0.05 });

      directRates.push(direct.secretKeyRateKbps);
      relayRates.push(relay.secretKeyRateKbps);
    }

    if (typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      this.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: distances,
          datasets: [
            {
              label: 'Direct LEO Satellite → Ground SKR (kbps)',
              data: directRates,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 2
            },
            {
              label: 'Relay-Assisted (LEO → HAP → Ground B) SKR (kbps)',
              data: relayRates,
              borderColor: '#00f3ff',
              backgroundColor: 'rgba(0, 243, 255, 0.15)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } } },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(6, 9, 19, 0.95)',
              borderColor: '#00f3ff',
              borderWidth: 1,
              titleColor: '#ffffff',
              bodyColor: '#00f3ff'
            }
          },
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } } },
            y: {
              type: 'linear',
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
            }
          }
        }
      });
    }
  }

  /**
   * Initializes all Relay-Aware Parameter Analysis Research Graphs
   */
  initResearchGraphs(currentParams = {}) {
    if (typeof Chart === 'undefined') return;

    // 1. QBER vs Link 1 Distance (Ground A -> Satellite)
    this.renderSingleResearchGraph('chartQberVsDistance', 'QBER vs Link 1 Distance (km)', 'Link 1 Dist (km)', 'QBER (%)', '#00f3ff', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, dist1: val }).qber;
    }, 100, 2000, 100);

    // 2. QBER vs Link 2 Distance (Satellite -> HAP Relay)
    this.renderSingleResearchGraph('chartQberVsLink2', 'QBER vs Link 2 Distance (km)', 'Link 2 Dist (km)', 'QBER (%)', '#a855f7', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, dist2: val }).qber;
    }, 100, 1500, 100);

    // 3. SKR vs Link 1 Distance
    this.renderSingleResearchGraph('chartSkrVsDistance', 'SKR vs Link 1 Distance (km)', 'Link 1 Dist (km)', 'SKR (kbps)', '#10b981', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, dist1: val }).secretKeyRateKbps;
    }, 100, 2000, 100);

    // 4. SKR vs Relay Processing Efficiency (%)
    this.renderSingleResearchGraph('chartSkrVsRelayEff', 'End-to-End SKR vs Relay Proc. Efficiency (%)', 'Proc Efficiency (%)', 'SKR (kbps)', '#f59e0b', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, relayProcEff: val / 100 }).secretKeyRateKbps;
    }, 50, 100, 5);

    // 5. End-to-End Delay vs Relay Processing Delay (ms)
    this.renderSingleResearchGraph('chartDelayVsRelayProc', 'Delay vs Relay Processing Delay (ms)', 'Proc Delay (ms)', 'Total Delay (ms)', '#ec4899', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, relayProcDelayMs: val }).totalDelayMs;
    }, 0.5, 10.0, 0.5);

    // 6. QBER vs Background Noise (cps)
    this.renderSingleResearchGraph('chartQberVsBgNoise', 'QBER vs Background Noise (cps)', 'Background Noise (cps)', 'QBER (%)', '#ef4444', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, bgNoiseCps: val }).qber;
    }, 0, 10000, 500);

    // 7. QBER vs Pointing Error (µrad)
    this.renderSingleResearchGraph('chartQberVsAtmosLoss', 'QBER vs Pointing Error (µrad)', 'Pointing Error (µrad)', 'QBER (%)', '#3b82f6', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, pointingErrorUrad: val }).qber;
    }, 0.1, 5.0, 0.25);

    // 8. SKR vs Detector Efficiency
    this.renderSingleResearchGraph('chartQberVsDetEff', 'SKR vs Detector Efficiency (η)', 'Detector Efficiency η', 'SKR (kbps)', '#10b981', (val) => {
      return window.qkdPhysics.calculateComprehensivePhysics({ ...currentParams, detEfficiency: val }).secretKeyRateKbps;
    }, 0.1, 0.95, 0.05);
  }

  renderSingleResearchGraph(canvasId, label, xTitle, yTitle, color, valueFn, minVal, maxVal, step) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.destroyChart(canvasId);

    const xLabels = [];
    const yValues = [];

    for (let x = minVal; x <= maxVal; x += step) {
      const formattedX = typeof x === 'number' && !Number.isInteger(x) ? x.toFixed(2) : x;
      xLabels.push(formattedX);
      yValues.push(valueFn(x));
    }

    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: xLabels,
        datasets: [{
          label: label,
          data: yValues,
          borderColor: color,
          backgroundColor: color.replace('1)', '0.15)').replace('rgb', 'rgba'),
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } }
        }
      }
    });
  }
}

window.qkdChartManager = new QKDChartManager();
