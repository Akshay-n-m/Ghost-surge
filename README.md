<div align="center">
  <img src="docs/assets/banner.png" alt="Ghost-Surge Banner" width="100%" />
  
  # GHOST-SURGE & SENTINEL-REEF 🌊
  
  **Tactical Marine Acoustic AI & HUD Orchestration System**
  
  [![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
  [![TensorFlow](https://img.shields.io/badge/YAMNet-AI_Audio-FF6F00?style=for-the-badge&logo=tensorflow)](https://www.tensorflow.org/)
</div>

<br />

> **GHOST-SURGE** is an advanced tactical Heads-Up Display (HUD) and command center interface, tightly integrated with **SENTINEL-REEF**, an AI-powered underwater acoustic analysis bridge. Together, they provide real-time marine threat detection, species classification, and 3D triangulation visualizations.

---

## 🚀 Key Features

### 💻 Frontend (Ghost-Surge Tactical HUD)
- **3D Bathymetric Globe:** A perfectly scaled, immersive interactive Earth model integrated via `@splinetool/loader`.
- **Live Oscilloscope:** Real-time waveform visualization streamed directly from the Python backend via WebSockets.
- **Species Classification Panel:** Dynamic probability bars identifying acoustic anomalies like *Submarine Churn, Snapping Shrimp, and Humpback Whales*.
- **Tactical Grid:** Interactive command modules including Forensic Analysis, SIGINT (Signals Intelligence), and Bathymetric Sensors.
- **Cinematic Matrix-Green Aesthetic:** High-fidelity custom CSS filters, uneven typewriter text animations, and glassmorphism styling.

### 🧠 Backend (Sentinel-Reef Audio Engine)
- **YAMNet Neural Engine:** Utilizes Google's YAMNet ONNX model trained on AudioSet to classify over 521 audio classes in real-time.
- **WebSocket Streaming:** A low-latency bridge capable of processing audio and continuously dispatching signal amplitudes and probabilities to the frontend.
- **Triangulation Logic:** Advanced simulated Time Difference of Arrival (TDOA) logic for mapping acoustic anomalies.

---

## 🛠️ Project Architecture

The repository is structured into a clean `frontend/` and `backend/` separation, bridged seamlessly via a central orchestrator.

```text
📦 Ghost-Surge-Unified
 ┣ 📂 backend                 # Python Audio Engine
 ┃ ┣ 📂 audio_engine          # Contains WAV test files, mic scanner, YAMNet model
 ┃ ┣ 📂 triangulation_logic   # TDOA math formulas
 ┃ ┗ 📜 sentinel_bridge.py    # Main WebSocket Server
 ┣ 📂 frontend                # React/Vite HUD
 ┃ ┣ 📂 src                   # Components (CommandHUD, LandingPage, Bathymetric)
 ┃ ┗ 📜 package.json          # Node dependencies
 ┗ 📜 main_orchestrator.py    # Master Boot Script
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- `pip` and `npm` installed.

### 1️⃣ Setup Dependencies

**Backend:**
```bash
cd backend/audio_engine
pip install -r requirements.txt # (ensure you have numpy, websockets, onnxruntime, sounddevice)
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2️⃣ Launch the System
To spin up both the **Sentinel-Reef AI Bridge** and the **Ghost-Surge UI**, simply run the unified master script from the root of the project:

```bash
python main_orchestrator.py
```

### 3️⃣ Access the HUD
Once the master script executes successfully, it will display the status of both nodes:
- **AI Backend Bridge:** `ws://localhost:8000`
- **Tactical HUD:** `http://localhost:3000`

Open `http://localhost:3000` in your browser.

---

## 📡 Simulating Anomalies

The UI allows for active engagement. You can click on the **Triangulation Grid** or select different **Audio Signatures** from the HUD to swap the live data stream fed by the Python backend.

- **`SUBMARINE CHURN`**: Low-frequency hums and cavitation.
- **`HUMPBACK WHALE`**: High-frequency marine mammal communications.
- **`SHRIMP SHRIKE`**: Sharp, crackling acoustic profiles.

---

<div align="center">
  <p><i>Classified Level 5 Operational Toolkit. Unauthorized access is strictly logged.</i></p>
</div>
