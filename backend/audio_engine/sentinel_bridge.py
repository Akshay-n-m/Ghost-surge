import asyncio
import json
import websockets
import wave
import base64
import numpy as np
import onnxruntime as ort
import csv
import io
import time

# --- AI Configuration: Local YAMNet (Unlimited) ---
print("Initializing Local AI Engine (YAMNet)...")
try:
    yamnet_session = ort.InferenceSession("yamnet.onnx")
    
    # Load class map
    class_map = {}
    with open('yamnet_class_map.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            class_map[int(row['index'])] = row['display_name']
    print(f"Local AI Ready. Loaded {len(class_map)} acoustic classes.")
except Exception as e:
    print(f"CRITICAL ERROR loading Local AI: {e}")
    yamnet_session = None

# Stream Configuration: Real Audio Source
AUDIO_SOURCES = {
    "submarine": "submarine_churn_16k.wav",
    "whale": "whale_song_16k.wav",
    "shrimp": "shrimp_shrike_16k.wav",
    "reef": "reef_ambient_16k.wav"
}

current_source_id = "submarine"
wav_reader = wave.open(AUDIO_SOURCES[current_source_id], 'rb')

# sounddevice for live mic (async compatible)
try:
    import sounddevice as sd
    has_mic = True
    # --- MIC CONFIGURATION ---
    # Change this ID if you see 'Silence' in the terminal meter. 
    # Available IDs are printed when you start the script.
    MIC_ID = 1
    GAIN_BOOST = 50.0 # Multiplier for quiet microphones
except ImportError:
    has_mic = False

# Store connected UI clients
connected_clients = set()
stream_active = asyncio.Event()
is_classifying = False

async def ws_handler(websocket):
    connected_clients.add(websocket)
    print(f"UI connected to WebSocket. Total clients: {len(connected_clients)}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("type") == "control":
                    action = data.get("action")
                    if action == "start":
                        stream_active.set()
                        print("Stream STARTED by UI.")
                    elif action == "stop":
                        stream_active.clear()
                        print("Stream STOPPED by UI.")
                    elif action == "change_source":
                        new_source = data.get("value")
                        global current_source_id, wav_reader
                        if new_source in AUDIO_SOURCES or new_source == "mic":
                            print(f"Switching source to: {new_source}")
                            current_source_id = new_source
                            if new_source != "mic":
                                if wav_reader: wav_reader.close()
                                try:
                                    wav_reader = wave.open(AUDIO_SOURCES[new_source], 'rb')
                                except Exception as e:
                                    print(f"Error opening {new_source}: {e}")
            except Exception as e:
                print(f"Error parsing UI message: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

async def broadcast_anomaly(anomaly_data):
    if connected_clients:
        message = json.dumps(anomaly_data)
        for ws in list(connected_clients):
            try:
                await ws.send(message)
            except websockets.exceptions.ConnectionClosed:
                if ws in connected_clients:
                    connected_clients.remove(ws)

async def get_next_hydrophone_chunk():
    """Stream raw PCM from the selected source (File or Mic)."""
    global wav_reader, current_source_id
    
    if current_source_id == "mic":
        if has_mic:
            try:
                try:
                    # Attempt 1: Stereo (2 channels) - common for multi-mic arrays
                    recording = await asyncio.to_thread(sd.rec, 1024, samplerate=16000, channels=2, dtype='int16', blocking=True, device=MIC_ID)
                    # Downmix to mono by taking the maximum or average
                    recording = np.mean(recording, axis=1).astype(np.int16)
                    recording = np.ascontiguousarray(recording)
                except Exception as mono_err:
                    # Fallback to Mono if Stereo fails
                    recording = await asyncio.to_thread(sd.rec, 1024, samplerate=16000, channels=1, dtype='int16', blocking=True, device=MIC_ID)
                        
                return np.ascontiguousarray(recording).tobytes()
            except Exception as e:
                print(f"\n[MIC ERROR] {e}. Check MIC_ID in code.")
                return b'\x00' * 2048 # Return silence so loop doesn't crash
        else:
            print("Mic not available. Falling back to submarine.")
            current_source_id = "submarine"
            wav_reader = wave.open(AUDIO_SOURCES[current_source_id], 'rb')

    data = wav_reader.readframes(1024)
    if not data:
        wav_reader.rewind()
        data = wav_reader.readframes(1024)
    
    await asyncio.sleep(0.064)
    return data

def classify_with_yamnet(pcm_buffer):
    """Run local ONNX inference on the audio buffer."""
    if not yamnet_session:
        return None
        
    # Convert PCM16 to Float32 (-1.0 to 1.0)
    audio_data = np.frombuffer(pcm_buffer, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Run inference
    # YAMNet input name is 'waveform'
    outputs = yamnet_session.run(None, {'waveform': audio_data})
    
    # output_0 is scores [num_frames, 521]
    scores = outputs[0]
    mean_scores = np.mean(scores, axis=0) # Average scores across the 8-second buffer
    
    # Mapping logic: Map 521 YAMNet classes to our 4 HUD categories
    # Whale: Class 131 (Whale vocalization)
    whale_score = float(mean_scores[131])
    
    # Shrimp: Insect (121), Clicking (485), Snapping (57)
    shrimp_score = float(max(mean_scores[121], mean_scores[485], mean_scores[57]))
    
    # Submarine/Propeller: Motorboat (298), Propeller (332), Engine (337), Ship (299)
    propeller_score = float(max(mean_scores[298], mean_scores[332], mean_scores[337], mean_scores[299]))
    
    # Ambient/Reef: Ocean (290), Waves (291), Water (282), Wind (277)
    ambient_score = float(max(mean_scores[290], mean_scores[291], mean_scores[282], mean_scores[277]))
    
    # Normalize and boost scores for UI visibility (YAMNet scores are often low)
    def boost(x): return min(1.0, x * 5.0) # Apply visibility boost
    
    results = {
        "Whale": boost(whale_score),
        "Shrimp": boost(shrimp_score),
        "Submarine/Propeller": boost(propeller_score),
        "Ambient/Reef": boost(ambient_score)
    }
    
    # Debug print the top local AI detections
    top_indices = np.argsort(mean_scores)[-3:][::-1]
    top_sounds = [f"{class_map.get(i, 'Unknown')}: {mean_scores[i]:.2f}" for i in top_indices]
    print(f"[Local AI] Detected: {', '.join(top_sounds)}")
    
    return results

async def run_classification_task(pcm_buffer):
    global is_classifying
    try:
        result = classify_with_yamnet(pcm_buffer)
        if result:
            print(f"[Local AI Analysis] Whale: {result['Whale']:.2f}, Propeller: {result['Submarine/Propeller']:.2f}")
            
            classifications = [
                { "name": "Alpheidae (Shrimp)", "prob": result["Shrimp"], "type": "biological" },
                { "name": "Balaenoptera (Whale)", "prob": result["Whale"], "type": "biological" },
                { "name": "Cavitation (Propeller)", "prob": result["Submarine/Propeller"], "type": "anomalous" },
                { "name": "Submarine Hum", "prob": result["Submarine/Propeller"] * 0.9, "type": "anomalous" }
            ]
            
            primary = max(classifications, key=lambda x: x["prob"])
            
            # Calculate Bio-Density and Stealth Index
            bio_density = result["Shrimp"] * 0.6 + result["Whale"] * 0.4 + result["Ambient/Reef"] * 0.2
            bio_density = min(1.0, bio_density)
            
            # Stealth Index is high when bio_density is high and propeller/submarine is low
            stealth_index = (bio_density * 0.8) + (1.0 - result["Submarine/Propeller"]) * 0.2
            stealth_index = min(1.0, max(0.0, stealth_index))
            
            await broadcast_anomaly({
                "type": "classification",
                "classifications": classifications,
                "primary_anomaly": primary["name"],
                "bio_density": bio_density,
                "stealth_index": stealth_index,
                "x": 30 + (hash(str(time.time())) % 40),
                "y": 30 + (hash(str(time.time())) % 40)
            })
    except Exception as e:
        print(f"Local AI Error: {e}")
    finally:
        is_classifying = False

async def stream_hydrophone_data():
    import array
    audio_buffer = bytearray()
    buffer_duration = 0.0
    
    while True:
        await stream_active.wait()
        audio_chunk = await get_next_hydrophone_chunk()
        
        # UI Waveform Data
        samples = array.array('h', audio_chunk)
        if len(samples) > 0:
            peak = max(abs(s) for s in samples)
            norm_amp = min(1.0, peak / 32768.0)
            
            # Mic Diagnostic: Persistent meter in console
            if current_source_id == "mic":
                boosted_amp = min(1.0, norm_amp * GAIN_BOOST)
                meter = "#" * int(boosted_amp * 30)
                print(f"\r[MIC SENSOR] [{meter:<30}] {norm_amp:.4f} (Boosted: {boosted_amp:.2f})", end="", flush=True)
                norm_amp = boosted_amp # Use boosted amplitude for UI waveform too

            await broadcast_anomaly({
                "type": "audio_stream",
                "amplitude": norm_amp,
                "data": base64.b64encode(audio_chunk).decode('utf-8')
            })
            
        # AI Accumulation
        audio_buffer.extend(audio_chunk)
        buffer_duration += (len(audio_chunk) / 2) / 16000.0
        
        if buffer_duration >= 8.0:
            buffer_copy = audio_buffer.copy()
            audio_buffer.clear()
            buffer_duration = 0.0
            
            global is_classifying
            if not is_classifying:
                is_classifying = True
                asyncio.create_task(run_classification_task(buffer_copy))

async def main():
    print("Starting WebSocket bridge on ws://localhost:8000...")
    if has_mic:
        print("\n--- Available Microphones ---")
        print(sd.query_devices())
        print(f"CURRENTLY USING MIC ID: {MIC_ID} (Change this in sentinel_bridge.py if needed)\n")

    async with websockets.serve(ws_handler, "localhost", 8000):
        while True:
            try:
                await stream_hydrophone_data()
            except Exception as e:
                print(f"\n[STREAM RECOVERED] Handled internal error: {e}")
                await asyncio.sleep(0.5)

def kill_port(port):
    import subprocess
    try:
        subprocess.run(["powershell", "-Command", f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"], capture_output=True, timeout=5)
    except: pass

if __name__ == "__main__":
    kill_port(8000)
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBridge terminated.")