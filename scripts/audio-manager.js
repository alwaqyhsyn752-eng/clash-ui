/* ============================================
   Clash of Armored - Audio Manager
   أصوات مولَّدة بـ Web Audio API (بدون ملفات)
   ============================================ */
(function () {
  let ctx = null;
  let enabled = true;
  let masterVolume = 0.6;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, dur = 0.08, type = 'square', vol = 0.15, slideTo = null }) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);

    gain.gain.setValueAtTime(vol * masterVolume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  window.CoaAudio = {
    click() {
      tone({ freq: 800, dur: 0.05, type: 'square', vol: 0.12, slideTo: 400 });
    },
    success() {
      tone({ freq: 600, dur: 0.08, type: 'triangle', vol: 0.15 });
      setTimeout(() => tone({ freq: 900, dur: 0.12, type: 'triangle', vol: 0.15 }), 80);
    },
    error() {
      tone({ freq: 220, dur: 0.15, type: 'sawtooth', vol: 0.12, slideTo: 110 });
    },
    coin() {
      tone({ freq: 1200, dur: 0.06, type: 'square', vol: 0.12 });
      setTimeout(() => tone({ freq: 1600, dur: 0.08, type: 'square', vol: 0.12 }), 60);
    },
    boom() {
      tone({ freq: 100, dur: 0.3, type: 'sawtooth', vol: 0.2, slideTo: 30 });
    },
    setVolume(v) { masterVolume = Math.max(0, Math.min(1, v)); },
    setEnabled(v) { enabled = !!v; },
    isEnabled() { return enabled; }
  };
})();
