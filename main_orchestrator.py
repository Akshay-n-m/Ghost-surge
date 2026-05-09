import subprocess
import time
import sys
import os

def run_orchestrator():
    print("="*50)
    print("      SENTINEL-REEF: UNIFIED OPERATOR VIEW")
    print("="*50)
    
    # Paths
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_script = os.path.join(root_dir, "backend", "audio_engine", "sentinel_bridge.py")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("\n[1/2] Launching Acoustic AI Backend...")
    # Run backend from its own directory so it finds its models/wavs
    backend_proc = subprocess.Popen(
        [sys.executable, "-u", "sentinel_bridge.py"],
        cwd=os.path.join(root_dir, "backend", "audio_engine")
    )
    
    time.sleep(2) # Give backend a moment to bind to port 8000

    print("[2/2] Launching React Tactical HUD...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd", "run", "dev"] if os.name == 'nt' else ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n" + "="*50)
    print("SYSTEM ONLINE.")
    print(f"HUD: http://localhost:3000")
    print(f"AI BRIDGE: ws://localhost:8000")
    print("Press Ctrl+C to terminate all systems.")
    print("="*50 + "\n")

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Error: Backend process terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Error: Frontend process terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nShutting down Sentinel-Reef...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        print("All systems offline.")

if __name__ == "__main__":
    run_orchestrator()
