import wave

def convert(input_file, output_file):
    print(f"Converting {input_file} to {output_file}...")
    with wave.open(input_file, 'rb') as w_in:
        rate = w_in.getframerate()
        width = w_in.getsampwidth()
        frames = w_in.readframes(w_in.getnframes())
        
    # Basic conversion logic: 24-bit to 16-bit
    # (Taking the most significant 16 bits of each 24-bit sample)
    pcm16 = bytearray()
    for i in range(0, len(frames), 3):
        # Assuming little-endian: [LSB, Mid, MSB]
        # We take Mid and MSB to get a 16-bit representation
        if i + 2 < len(frames):
            pcm16.append(frames[i+1])
            pcm16.append(frames[i+2])
    
    # Downsample: 48kHz to 16kHz (Every 3rd sample)
    resampled = bytearray()
    for i in range(0, len(pcm16), 6): # 2 bytes/sample * 3 samples = 6 bytes
        if i + 1 < len(pcm16):
            resampled.append(pcm16[i])
            resampled.append(pcm16[i+1])
            
    with wave.open(output_file, 'wb') as w_out:
        w_out.setnchannels(1)
        w_out.setsampwidth(2)
        w_out.setframerate(16000)
        w_out.writeframes(resampled)
    print("Done.")

convert('submarine_motor.wav', 'submarine_motor_16k.wav')
convert('submarine_churn.wav', 'submarine_churn_16k.wav')
