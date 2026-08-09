import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isListening: boolean;
  stream?: MediaStream | null;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isListening,
  stream,
  barCount = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isListening) return;

    let animationFrameId: number;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (stream) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        console.warn('AudioContext setup error for waveform:', e);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      phase += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      }

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / barCount) * 0.6;
      const gap = (width - barCount * barWidth) / (barCount + 1);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 12;

        if (dataArray && dataArray.length > 0) {
          const val = dataArray[i % dataArray.length] || 0;
          barHeight = Math.max(8, (val / 255) * height * 0.85);
        } else {
          // Simulated smooth organic sine wave if no raw stream attached
          const sineVal = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const cosVal = Math.cos(phase * 0.7 + i * 0.2) * 0.5 + 0.5;
          barHeight = 8 + (sineVal * cosVal) * (height * 0.75);
        }

        const x = gap + i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Gradient for waveform
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#10B981'); // Emerald 500
        gradient.addColorStop(0.5, '#34D399'); // Emerald 400
        gradient.addColorStop(1, '#059669'); // Emerald 600

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isListening, stream, barCount]);

  return (
    <div className="w-full flex items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        className="w-full max-w-xs h-16 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 backdrop-blur-sm shadow-inner"
      />
    </div>
  );
};
