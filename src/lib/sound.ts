// 用 Web Audio API 即時合成的短音效，不需要額外音檔資源

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playTone(frequencies: number[], duration: number, type: OscillatorType) {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = now + i * duration;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });
}

// 在指定時間點同時發出一個或多個頻率（和弦），用來堆疊出更有張力的音效
function playChordAt(
  ctx: AudioContext,
  frequencies: number[],
  time: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  frequencies.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  });
}

// 頻率會隨時間滑動的一段音（例如錯誤音效常見的下滑蜂鳴聲）
function playSlideAt(
  ctx: AudioContext,
  freqFrom: number,
  freqTo: number,
  time: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, time);
  osc.frequency.linearRampToValueAtTime(freqTo, time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration + 0.02);
}

/** 操作成功／答對：上揚的兩音符 */
export function playSuccessSound() {
  playTone([523.25, 783.99], 0.1, "sine");
}

/** 操作失敗／答錯：下降的低沉音 */
export function playErrorSound() {
  playTone([220, 164.81], 0.14, "square");
}

/** 一般操作（例如執行指令）的輕微回饋音 */
export function playClickSound() {
  playTone([440], 0.06, "sine");
}

/** 測驗答對：快速上揚琶音再收尾在明亮和弦，張力更強的慶祝音效 */
export function playQuizCorrectSound() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const arpeggio = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
  arpeggio.forEach((freq, i) => playChordAt(ctx, [freq], now + i * 0.075, 0.14, "triangle", 0.22));
  const chordStart = now + arpeggio.length * 0.075;
  playChordAt(ctx, [1046.5, 1318.51, 1567.98], chordStart, 0.4, "triangle", 0.18); // C6-E6-G6 收尾亮音
}

/** 測驗答錯：短促警示雙音 + 下滑蜂鳴，張力更強的錯誤音效 */
export function playQuizWrongSound() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playChordAt(ctx, [196], now, 0.09, "square", 0.24); // 兩聲急促警示音
  playChordAt(ctx, [185], now + 0.11, 0.09, "square", 0.24);
  playSlideAt(ctx, 220, 70, now + 0.24, 0.4, "sawtooth", 0.2); // 下滑蜂鳴收尾
}

