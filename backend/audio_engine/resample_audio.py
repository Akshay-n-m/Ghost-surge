import wave
import numpy as np

def resample_wav(input_path, output_path, target_rate=16000):
    with wave.open(input_path, 'rb') as w:
        params = w.getparams()
        n_channels = params.nchannels
        sampwidth = params.sampwidth
        old_rate = params.framerate
        n_frames = params.nframes
        
        data = w.readframes(n_frames)
        
        # Convert to numpy array
        if sampwidth == 2:
            samples = np.frombuffer(data, dtype=np.int16)
        else:
            print(f"Unsupported sample width: {sampwidth}")
            return

        # Resample
        duration = n_frames / old_rate
        new_n_frames = int(duration * target_rate)
        
        old_indices = np.linspace(0, n_frames - 1, n_frames)
        new_indices = np.linspace(0, n_frames - 1, new_n_frames)
        
        resampled_samples = np.interp(new_indices, old_indices, samples).astype(np.int16)
        
        # Write to new file
        with wave.open(output_path, 'wb') as out_w:
            out_w.setnchannels(n_channels)
            out_w.setsampwidth(sampwidth)
            out_w.setframerate(target_rate)
            out_w.writeframes(resampled_samples.tobytes())
            print(f"Successfully resampled {input_path} from {old_rate}Hz to {target_rate}Hz")

if __name__ == "__main__":
    resample_wav('shrimp_shrike.wav', 'shrimp_shrike_16k.wav')
    resample_wav('reef_ambient.wav', 'reef_ambient_16k.wav')
    resample_wav('whale_song.wav', 'whale_song_16k.wav')
    resample_wav('humpback_whale_16k.wav', 'humpback_whale_final_16k.wav') # The 8k one
