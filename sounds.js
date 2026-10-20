/* Cute sound effects, synthesized live with Web Audio (no audio files, so they work offline too).
   Every pup has its own voice: toy pups yip high and twice, giants give one deep "woof".
   Toggle with the 🔊 button or the M key; the choice is saved in localStorage ("puppyPals.sound"). */
(function () {
  "use strict";
  var KEY = "puppyPals.sound";
  var on = true; try { on = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  var ctx = null, log = [];
  var PITCH = { toy: 1.7, small: 1.35, medium: 1, large: 0.78, giant: 0.6 };
  function audio() {
    // browsers only allow sound after the user has tapped or pressed something
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(function () {});
    return ctx;
  }
  function tone(c, t, f0, f1, dur, type, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function barkVoice(b) { var k = PITCH[b && b.size] || 1; return { k: k, times: k > 1.2 ? 2 : 1 }; }
  var SFX = {
    bark: function (c, t, b) {
      var v = barkVoice(b);
      for (var i = 0; i < v.times; i++) {
        var s = t + i * 0.15;
        tone(c, s, 560 * v.k, 300 * v.k, 0.14, "triangle", 0.2);
        tone(c, s, 1120 * v.k, 620 * v.k, 0.07, "square", 0.025);
      }
    },
    heart: function (c, t) { tone(c, t, 660, 990, 0.11, "sine", 0.16); tone(c, t + 0.09, 990, 1480, 0.16, "sine", 0.13); },
    unheart: function (c, t) { tone(c, t, 560, 380, 0.16, "sine", 0.1); },
    yay: function (c, t) { [784, 988, 1175, 1568].forEach(function (f, i) { tone(c, t + i * 0.07, f, 0, 0.2, "triangle", 0.13); }); },
    oops: function (c, t) { tone(c, t, 440, 350, 0.2, "sine", 0.14); tone(c, t + 0.18, 350, 262, 0.32, "sine", 0.12); },
    fanfare: function (c, t) {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(c, t + i * 0.11, f, 0, 0.22, "triangle", 0.13); });
      tone(c, t + 0.48, 1047, 0, 0.5, "triangle", 0.12); tone(c, t + 0.48, 1319, 0, 0.5, "sine", 0.08);
    },
    pop: function (c, t) { tone(c, t, 400, 900, 0.09, "sine", 0.16); }
  };
  function play(name, b) {
    if (!on || !SFX[name]) return false;
    log.push(name + (name === "bark" && b ? ":" + b.size : ""));
    if (log.length > 50) log.shift();
    var c = audio(); if (!c) return true;
    try { SFX[name](c, c.currentTime + 0.01, b); } catch (e) {}
    return true;
  }
  var btn = document.getElementById("sndbtn");
  function paint() {
    if (!btn) return;
    btn.setAttribute("aria-pressed", on);
    btn.textContent = on ? "🔊" : "🔇";
    btn.title = on ? "Sounds on (M to mute)" : "Sounds off (M to turn on)";
    btn.setAttribute("aria-label", on ? "Sound effects on" : "Sound effects off");
  }
  function set(v) {
    on = !!v; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    paint();
    if (on) play("pop");
    if (window.PuppyPals && PuppyPals.toast) PuppyPals.toast(on ? "🔊 Woof! Sounds on" : "🔇 Shh, sounds off");
  }
  if (btn) btn.onclick = function () { set(!on); };
  document.addEventListener("keydown", function (e) {
    if (e.key !== "m" && e.key !== "M") return;
    var t = e.target, tag = t && t.tagName;
    if (e.ctrlKey || e.metaKey || e.altKey || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    set(!on);
  });
  paint();
  window.PuppySound = { play: play, enabled: function () { return on; }, set: set, voice: barkVoice, log: log };
})();
