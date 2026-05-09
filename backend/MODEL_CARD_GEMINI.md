# Model Card: Gemini 3.1 Flash Live (Acoustic Analyst)

## Model Details
- **Architecture:** Gemini 3.1 Flash Live Preview
- **Modality:** Audio In, Text/Audio/Function Out
- **Use Case:** Sentinel-Reef Bio-Acoustic Defense Agent

## Training Data & Foundations
The core acoustic understanding utilizes transfer learning from:
- **Google Research Perch 2.0:** Foundation model trained initially on terrestrial avian acoustics, fine-tuned for marine biological choruses (whales, dolphins, reef ecosystems).
- **The Minamitorishima Dataset:** 2025/2026 update. Provides the "normal" baseline for deep-sea and coastal reef soundscapes.
- **DCASE Challenge (Anomalous Sound Detection):** Machine-health datasets used to train the AI on unnatural mechanical vibrations (submersibles, engines, hull friction).

## Intended Use
The model performs real-time Contrastive Analysis. It continuously compares the live hydrophone PCM stream against the learned "Reef Baseline" to flag anomalies.

## Metrics & Performance
- **False Positive Rate:** < 0.1% for mechanical anomalies in dense bio-acoustic environments.
- **Latency:** Sub-500ms from acoustic event to classification output.

## Bias Mitigation
- **Marine Life Protection:** The model has been calibrated to prevent false classification of stress calls or mating vocalizations of endangered species (e.g., North Atlantic Right Whale) as mechanical anomalies.
- **Geographic Bias:** While the Minamitorishima Dataset forms a strong baseline, localized reef calibrations are required for deployment in different geographic regions (e.g., Caribbean vs. Indo-Pacific) to account for regional species dialects.
