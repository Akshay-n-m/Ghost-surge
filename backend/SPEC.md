# Sentinel-Reef: System Specification

## Overview
**Sentinel-Reef** is a defense-grade bio-acoustic monitoring and threat-detection system. It leverages smart artificial reef structures equipped with advanced hydrophone arrays to provide real-time underwater intelligence. The system discriminates between natural marine biological activity (bio-acoustics) and anomalous mechanical signatures (e.g., UUVs, submersibles).

## Architecture
The system is divided into three primary modules:

### 1. Audio Engine (`/audio_engine`)
- **Purpose**: High-fidelity, low-latency ingestion of multi-channel hydrophone data.
- **Capabilities**:
  - Continuous passive acoustic monitoring (PAM).
  - Noise floor normalization and dynamic range compression.
  - Fast Fourier Transform (FFT) and spectrogram generation.
  - Neural network-based classification of acoustic signatures (biological vs. mechanical).

### 2. Triangulation Logic (`/triangulation_logic`)
- **Purpose**: Spatial tracking and positioning of acoustic sources.
- **Capabilities**:
  - Time Difference of Arrival (TDOA) calculations across the distributed sensor network.
  - Predictive trajectory modeling for moving acoustic targets.
  - Confidence scoring for triangulated coordinates.
  - Anomaly alerting when mechanical signatures enter restricted perimeter zones.

### 3. Vibe UI (`/vibe_ui`)
- **Purpose**: Tactical operator dashboard.
- **Capabilities**:
  - Real-time geospatial mapping of the monitored underwater region.
  - Visual distinction between biological contacts (green) and unknown/hostile contacts (red).
  - Live spectrogram feeds from selected sensor nodes.
  - System health, calibration, and environmental data readouts.

## Deployment Environment
- **Hardware**: Ruggedized edge-compute nodes integrated into artificial reef structures.
- **Communication**: Inter-node acoustic modems for low-bandwidth telemetry, with a hardwired fiber optic backbone to the surface/shore station.
- **Resilience**: Fault-tolerant mesh architecture ensuring the array remains operational if individual nodes fail.
