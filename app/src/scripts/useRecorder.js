import { useState, useRef, useCallback } from "react";
import { encodeWAV } from "./api";

/**
 * Self-contained per-instance audio recorder hook.
 * Each RecorderBlock gets its own instance — no shared global state.
 */
export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState("0:00");

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const pcmRef = useRef([]);
  const timerRef = useRef(null);
  const secsRef = useRef(0);

  const start = useCallback(async () => {
    if (isRecording) return { ok: false, error: "Already recording." };

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const ctx = new AudioContext({ sampleRate: 16000 });
      const src = ctx.createMediaStreamSource(streamRef.current);
      const proc = ctx.createScriptProcessor(4096, 1, 1);

      pcmRef.current = [];
      proc.onaudioprocess = (e) => {
        pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      src.connect(proc);
      proc.connect(ctx.destination);

      audioCtxRef.current = ctx;
      processorRef.current = proc;
      sourceRef.current = src;
      secsRef.current = 0;

      setElapsed("0:00");
      timerRef.current = setInterval(() => {
        secsRef.current++;
        const m = Math.floor(secsRef.current / 60);
        const s = String(secsRef.current % 60).padStart(2, "0");
        setElapsed(`${m}:${s}`);
      }, 1000);

      setIsRecording(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [isRecording]);

  const stop = useCallback(() => {
    if (!isRecording) return null;

    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();

    const chunks = pcmRef.current;
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const merged = new Float32Array(total);
    let off = 0;
    for (const c of chunks) {
      merged.set(c, off);
      off += c.length;
    }

    setIsRecording(false);
    setElapsed("0:00");

    return encodeWAV(merged, 16000);
  }, [isRecording]);

  return { isRecording, elapsed, start, stop };
}
