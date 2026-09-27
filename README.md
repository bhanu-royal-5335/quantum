# Hierarchical Quantum Optical Communication Simulation & Verification Web Application

## Overview
This platform is a research/academic web application prototype demonstrating a space-to-ground quantum communication system:
$$\text{Alice (Quantum Source)} \longrightarrow \text{LEO Satellite} \longrightarrow \text{Relay / HAP} \longrightarrow \text{Bob (Ground Receiver)}$$

The purpose of the prototype is to model, simulate, and verify how atmospheric attenuation, atmospheric turbulence, platform pointing error, receiver dark counts, background noise, and link geometry affect:
* **Quantum Bit Error Rate (QBER)**
* **Optical Channel Loss & Link Budgets**
* **Secret-Key Generation Rate**
* **Monte-Carlo Statistical Confidence Intervals (95% CI)**
* **End-to-End Quantum Security Bounds**

---

## System Architecture

```text
┌─────────────────┐
│     ALICE       │
│  Quantum Source │
└────────┬────────┘
         │ State Encoding (|0⟩, |1⟩, |+⟩, |−⟩)
         ▼
┌─────────────────┐
│  LEO SATELLITE  │ (Orbit: 300 - 1,500 km)
└────────┬────────┘
         │ FSO Link 1 (Vacuum / Upper Stratosphere)
         ▼
┌─────────────────┐
│   RELAY / HAP   │ (Stratosphere: 20 km altitude)
└────────┬────────┘
         │ FSO Link 2 (Dense Tropospheric Slant Path)
         ▼
┌─────────────────┐
│       BOB       │ (Ground Optical Station)
│ Single-Photon   │ (Active FSM, Superconducting Detectors)
└─────────────────┘
```

### Complete Pipeline
$$\text{Quantum State} \longrightarrow \text{Transmission} \longrightarrow \text{Atmospheric Channel} \longrightarrow \text{Error Estimation (QBER)} \longrightarrow \text{Information Reconciliation} \longrightarrow \text{Privacy Amplification} \longrightarrow \text{Secure Key}$$

---

## Physical & Mathematical Formulations

### 1. Atmospheric Attenuation (Kim & Kruse Model)
The optical attenuation coefficient $\alpha(\lambda)$ at ground level is calculated as:
$$\alpha(\lambda, V) = \frac{3.91}{V} \left( \frac{\lambda}{550\text{ nm}} \right)^{-q} \quad [\text{dB/km}]$$
where $V$ is visibility in km, $\lambda$ is wavelength in nm, and $q$ is Kim's size distribution factor:
* $q = 1.6$ for $V > 50\text{ km}$
* $q = 1.3$ for $6 < V \le 50\text{ km}$
* $q = 0.16V + 0.34$ for $1 < V \le 6\text{ km}$
* $q = V - 0.5$ for $0.5 < V \le 1\text{ km}$
* $q = 0$ for $V \le 0.5\text{ km}$

Atmospheric density is integrated vertically using an exponential scale height $H_0 = 7.0\text{ km}$:
$$\rho(h) = \rho_0 \exp\left( -\frac{h}{H_0} \right)$$
Space-to-Relay (Link 1, 500 km down to 20 km) passes through less than 5% of atmospheric mass, avoiding tropospheric fog. Relay-to-Bob (Link 2, 20 km to 0 km) passes through the dense boundary layer.

### 2. Geometric Free-Space Path Loss
Gaussian beam spot radius $w(L)$ at distance $L$:
$$w(L) = \sqrt{\left(\frac{D_{tx}}{2}\right)^2 + \left(\frac{\theta_{div} L}{2}\right)^2}$$
Power collected by circular receiver aperture $D_{rx}$:
$$\eta_{geo} = 1 - \exp\left( -2 \frac{(D_{rx}/2)^2}{w(L)^2} \right)$$

### 3. Atmospheric Turbulence (Rytov & Scintillation)
Ground turbulence parameter $C_n^2(0)$ follows the modified Hufnagel-Valley (HV 5/7) profile.
Downlink spherical-wave Rytov variance:
$$\sigma_R^2 = 2.25 k^{7/6} (\sec \zeta)^{11/6} \int_0^H C_n^2(h) \left(1 - \frac{h}{H}\right)^{5/6} h^{5/6} dh$$
Scintillation index $\sigma_I^2$ incorporating receiver aperture averaging:
$$\sigma_I^2 = \exp\left[ \frac{0.49 \sigma_R^2}{(1 + 0.18 d^2 + 0.56 \sigma_R^{12/5})^{7/6}} + \frac{0.51 \sigma_R^2}{(1 + 0.90 d^2 + 0.69 \sigma_R^{12/5})^{5/6}} \right] - 1$$
Intensity fluctuations follow a Log-Normal distribution $I \sim \text{LogNormal}(-\sigma_I^2/2, \sigma_I)$.

### 4. Transceiver Pointing Jitter (Farid & Hranilovic Model)
Transmitter 2D angular jitter $\sigma_s$ induces radial misalignment $r \sim \text{Rayleigh}(L \cdot \sigma_s)$.
Average coupling factor:
$$\langle h_p \rangle = A_0 \left( \frac{\gamma^2}{\gamma^2 + 1} \right)$$
where $v = \frac{\sqrt{\pi} D_{rx}/2}{\sqrt{2} w_z}$, $A_0 = [\text{erf}(v)]^2$, and $w_{eq}^2 = w_z^2 \frac{\sqrt{\pi}\text{erf}(v)}{2v\exp(-v^2)}$.

### 5. Detection & QBER Calculation
Click probability per detection gate:
$$P_{click} = 1 - (1 - P_{signal}) (1 - P_{dark}) (1 - P_{bg})$$
Error probability:
$$P_{error} = e_{opt} \cdot P_{signal} + 0.5 \cdot (P_{dark} + P_{bg})$$
$$QBER = \frac{P_{error}}{P_{click}}$$

### 6. Information Reconciliation & Asymptotic Secret Key Rate
$$R_{secure} = \max\left( 0, R_{sifted} \cdot [1 - f_{EC} H_2(QBER) - H_2(QBER)] \right)$$
where $H_2(x) = -x \log_2(x) - (1-x)\log_2(1-x)$, $f_{EC} \approx 1.16$ is error correction efficiency, and $R_{sifted} = 0.5 R_{rep} P_{click}$.
Asymptotic BB84 security threshold: $QBER < 11.0\%$.

---

## Project Structure
```text
quantum-communication-prototype/
├── backend/
│   ├── api/
│   │   ├── simulation.py      # Simulation execution & history routes
│   │   ├── scenarios.py       # Benchmark scenarios & comparison routes
│   │   └── reports.py         # 17-section PDF & CSV export routes
│   ├── simulation/
│   │   ├── bb84.py            # Discrete BB84 quantum protocol simulator
│   │   ├── atmosphere.py      # Kim/Kruse attenuation & geometric coupling
│   │   ├── turbulence.py      # HV Cn2 profile & spherical Rytov variance
│   │   ├── pointing_error.py  # Farid-Hranilovic pointing jitter
│   │   ├── noise.py           # Single-photon detector & background noise
│   │   ├── secret_key.py      # Shannon entropy & security threshold
│   │   ├── qber.py            # Parametric sweep curves
│   │   ├── channel.py         # End-to-end channel orchestrator
│   │   └── monte_carlo.py     # Vectorized Monte Carlo statistical engine
│   ├── models/
│   │   └── schemas.py         # Pydantic schemas
│   ├── reports/
│   │   └── generator.py       # ReportLab PDF & CSV generator
│   ├── tests/
│   │   ├── test_simulation.py # Comprehensive test suite (10/10 tests)
│   │   └── run_tests.py       # Standalone test runner
│   ├── data/
│   │   └── quantum_sim.db     # SQLite persistence
│   ├── main.py                # FastAPI entrypoint
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/        # ArchitectureVisualizer, KpiCards, BitTraceTable, Sidebar, Header
│   │   ├── pages/             # Dashboard, Scenario, Parameters, Channel, Simulation, Results, Compare, Report
│   │   ├── charts/            # 5 interactive Recharts graphs
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript definitions
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Running the Application Locally

### 1. Start the Backend API Server
```bash
# In project root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`

### 2. Start the Frontend Development Server
```bash
# In frontend directory
cd frontend
npm run dev
```
Web Application will be available at: `http://localhost:5173`

### 3. Run the Unit Test Suite
```bash
python -m backend.tests.run_tests
```

---

## Benchmark Scenarios
* **Scenario A:** Baseline LEO (500 km) → HAP Relay (20 km) → Ground (Clear atmosphere, low jitter)
* **Scenario B:** Extended Orbit Distance (1,000 km LEO)
* **Scenario C:** Adverse Weather / Ground Fog ($V = 3\text{ km}$)
* **Scenario D:** Strong Turbulence ($C_n^2 = 1.0 \times 10^{-13}\text{ m}^{-2/3}$)
* **Scenario E:** High Platform Pointing Jitter ($\sigma_s = 10.0\ \mu\text{rad}$)
* **Scenario F:** Direct Downlink Without Relay (LEO to Ground direct slant path)
