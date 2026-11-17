import type {AlertTone, InAppAlertBanner} from '../types/hasanat';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAlertTone(tone: AlertTone): void {
  if (tone === 'silent') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (tone === 'adhan_chime') {
    // Hijaz-inspired gentle Adhan melodic motif (D4 - Eb4 - F#4 - G4 - A4 - F#4)
    const notes = [
      {freq: 293.66, start: 0, dur: 0.45, gain: 0.16},
      {freq: 311.13, start: 0.42, dur: 0.35, gain: 0.14},
      {freq: 369.99, start: 0.78, dur: 0.55, gain: 0.18},
      {freq: 392.0, start: 1.32, dur: 0.45, gain: 0.16},
      {freq: 440.0, start: 1.76, dur: 0.7, gain: 0.18},
      {freq: 369.99, start: 2.48, dur: 0.85, gain: 0.14},
    ];
    for (const n of notes) {
      playSoftBellNote(ctx, n.freq, now + n.start, n.dur, n.gain);
    }
  } else if (tone === 'takbir_chime') {
    // Double ascending chime
    const notes = [
      {freq: 392.0, start: 0, dur: 0.32, gain: 0.16},
      {freq: 523.25, start: 0.28, dur: 0.6, gain: 0.18},
      {freq: 392.0, start: 0.95, dur: 0.32, gain: 0.14},
      {freq: 587.33, start: 1.22, dur: 0.75, gain: 0.18},
    ];
    for (const n of notes) {
      playSoftBellNote(ctx, n.freq, now + n.start, n.dur, n.gain);
    }
  } else if (tone === 'fajr_dawn') {
    // Gentle ascending Fajr dawn motif (Saba/Hijaz serene chime)
    const notes = [
      {freq: 261.63, start: 0, dur: 0.55, gain: 0.14},
      {freq: 329.63, start: 0.45, dur: 0.5, gain: 0.15},
      {freq: 392.0, start: 0.9, dur: 0.6, gain: 0.16},
      {freq: 523.25, start: 1.45, dur: 0.95, gain: 0.14},
    ];
    for (const n of notes) {
      playSoftBellNote(ctx, n.freq, now + n.start, n.dur, n.gain);
    }
  } else {
    // Golden Bell
    playSoftBellNote(ctx, 523.25, now, 0.5, 0.15);
    playSoftBellNote(ctx, 659.25, now + 0.18, 0.8, 0.12);
  }
}

export function playGameFeedbackTone(correct: boolean): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  if (correct) {
    playSoftBellNote(ctx, 523.25, now, 0.25, 0.12);
    playSoftBellNote(ctx, 659.25, now + 0.1, 0.35, 0.14);
  } else {
    playSoftBellNote(ctx, 220.0, now, 0.28, 0.12);
    playSoftBellNote(ctx, 196.0, now + 0.12, 0.32, 0.1);
  }
}

function playSoftBellNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number
) {
  const osc = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  harmonic.type = 'triangle';
  harmonic.frequency.setValueAtTime(freq * 2, startTime);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0.18, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  harmonic.start(startTime);
  osc.stop(startTime + duration + 0.05);
  harmonic.stop(startTime + duration + 0.05);
}

export function playTasbihClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(760, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.055);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function triggerCustomAlert(params: {
  title: string;
  arabicTitle?: string;
  body: string;
  tone: AlertTone;
  snoozeMinutes?: number;
  prayerId?: import('../types/hasanat').PrayerId;
  onInAppBanner?: (banner: InAppAlertBanner) => void;
}): Promise<void> {
  playAlertTone(params.tone);

  params.onInAppBanner?.({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: params.title,
    arabicTitle: params.arabicTitle,
    body: params.body,
    timestamp: Date.now(),
    tone: params.tone,
    snoozeMinutes: params.snoozeMinutes,
    prayerId: params.prayerId,
  });

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notifTitle = params.arabicTitle ? `${params.arabicTitle} · ${params.title}` : params.title;
  const options: NotificationOptions = {
    body: params.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `hasanat-${params.title}`,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(notifTitle, options);
        return;
      }
    }
    new Notification(notifTitle, options);
  } catch {
    // Fallback safely if OS notification is blocked inside sandboxed iframe
  }
}
