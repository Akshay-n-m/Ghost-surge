# Architecture Document: Underwater Acoustic Sensor Networks (UWASN)
**Compliance:** ISO/IEC 30140:2018

## 1. Scope
This document specifies the architectural framework for the Sentinel-Reef UWASN, addressing network topologies, protocols, and interfaces for marine bio-acoustic monitoring and anomaly detection.

## 2. Reference Architecture
The Sentinel-Reef UWASN adopts a tiered architecture:
- **Perception Layer:** Edge hydrophone arrays deployed on artificial reef structures.
- **Network Layer:** Inter-node acoustic modems communicating via a mesh topology. A master node bridges to a shore station via a fiber-optic backbone.
- **Application Layer:** The `audio_engine` and `triangulation_logic` deployed on edge nodes for localized processing.

## 3. Interfaces and Protocols
- **Data Encapsulation:** All acoustic telemetry utilizes UDP-based lightweight encapsulation optimized for low bandwidth (underwater acoustic channels).
- **Time Synchronization:** Nodes utilize Precision Time Protocol (PTP) over the fiber backbone, synchronizing edge clocks to within 1 microsecond to enable accurate TDOA triangulation.

## 4. Security Framework
In accordance with ISO/IEC 30140-4, the network implements end-to-end encryption using AES-256 for all command and control telemetry to prevent unauthorized intrusion.
