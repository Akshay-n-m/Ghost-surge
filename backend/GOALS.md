# Sentinel-Reef: Project Goals

## Primary Objectives
1. **Bio-Acoustic Fidelity**: Establish a robust ingest pipeline capable of 99.9% uptime and high-fidelity signal capture from the hydrophone array.
2. **Accurate Threat Detection**: Implement AI/ML classification with less than 0.1% false-positive rate for mechanical anomalies in a dense bio-acoustic environment.
3. **Precision Tracking**: Achieve sub-meter accuracy in triangulating targets moving at speeds up to 50 knots.
4. **Tactical Superiority UI**: Deliver a zero-latency, highly intuitive operator dashboard that visualizes acoustic intelligence intuitively for rapid decision making.

## Milestone 1: Audio Ingestion & DSP
- Establish `/audio_engine`.
- Build the core audio pipeline for handling multi-channel PCM streams.
- Implement FFT and basic filtering to isolate relevant frequency bands.

## Milestone 2: Triangulation & Tracking
- Establish `/triangulation_logic`.
- Integrate TDOA algorithms using synchronized time-series data.
- Output real-time target vectors (bearing, range, velocity).

## Milestone 3: The Tactical Vibe UI
- Establish `/vibe_ui`.
- Connect the frontend to the backend data streams via WebSockets.
- Implement the geospatial map view and real-time spectrogram displays.

## Success Criteria
- The system must operate independently on edge nodes for up to 72 hours without central server communication.
- End-to-end latency from acoustic event to UI display must be under 500ms.
- The UI must maintain a smooth 60fps rendering even with 1000+ active contacts tracked simultaneously.
