# Signal Integrity & Hardware Filtration Report
**Standard:** MIL-STD-461G
**System:** Sentinel-Reef Hydrophone Edge Nodes

## 1. Overview
This document details the Electromagnetic Interference (EMI) filtering mechanisms employed by the Sentinel-Reef acoustic sensors to ensure signal integrity in high-noise coastal environments.

## 2. Requirements Compliance
- **CE101 & CE102 (Conducted Emissions):** The hydrophone power lines utilize active power factor correction (PFC) and multi-stage LC filters to attenuate emissions below the specified military limits from 30 Hz to 10 MHz.
- **RE102 (Radiated Emissions):** All sensor processing enclosures are fabricated from anodized aluminum with EMI gasketing. Internal components are shielded with mu-metal to prevent magnetic interference with the low-voltage analog hydrophone signals.
- **CS101 (Conducted Susceptibility):** The analog-to-digital converter (ADC) stages feature high-CMRR (Common-Mode Rejection Ratio) differential amplifiers capable of rejecting induced currents on the power lines up to 150 kHz.

## 3. Acoustic Filtering
Prior to A/D conversion, the analog signal undergoes:
- A 10 Hz high-pass filter to eliminate tidal flow noise.
- An anti-aliasing low-pass filter set at 8 kHz (Nyquist for 16kHz sampling rate).

*Note: To generate a PDF version of this document for formal submission, use a markdown-to-pdf conversion tool.*
