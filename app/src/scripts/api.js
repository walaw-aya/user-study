// ─── GET (with redirect following — GAS redirects by default) ─────────────────
export async function gasGet(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${import.meta.env.VITE_API_URL}?${qs}`);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  return res.json();
}

// ─── POST (no-cors — response is opaque, but GAS still processes it) ─────────
export async function gasPost(params) {
  return fetch(import.meta.env.VITE_API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
}

// ─── WAV ENCODER ──────────────────────────────────────────────────────────────
export function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const write = (off, str) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(off + i, str.charCodeAt(i));
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * 16) / 8, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}
