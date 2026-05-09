import sounddevice as sd
import numpy as np
import time

def scan_mics():
    print("--- Scanning all input devices for 2 seconds each ---")
    print("Please speak or make noise during the scan!\n")
    
    devices = sd.query_devices()
    input_devices = [i for i, d in enumerate(devices) if d['max_input_channels'] > 0]
    
    results = []
    
    for device_id in input_devices:
        name = devices[device_id]['name']
        channels = min(2, devices[device_id]['max_input_channels'])
        print(f"Testing Device {device_id}: {name} ({channels} channels)...", end="", flush=True)
        
        try:
            # Record 2 seconds
            duration = 2.0
            fs = 16000
            recording = sd.rec(int(duration * fs), samplerate=fs, channels=channels, dtype='float32', device=device_id)
            sd.wait()
            
            peak = np.max(np.abs(recording))
            results.append((device_id, name, peak))
            print(f" Peak Amplitude: {peak:.6f}")
        except Exception as e:
            print(f" Error: {e}")
            
    print("\n--- Scan Results ---")
    results.sort(key=lambda x: x[2], reverse=True)
    for res in results:
        star = "*" if res[2] > 0.01 else " "
        print(f"{star} ID {res[0]:2d}: {res[1]:<40} Peak: {res[2]:.6f}")

    if results[0][2] < 0.001:
        print("\nWARNING: No significant audio detected on ANY device.")
        print("Please check if your microphone is MUTED in Windows settings or on your physical hardware.")
    else:
        print(f"\nSUCCESS: Device {results[0][0]} seems to be the active microphone.")

if __name__ == "__main__":
    scan_mics()
