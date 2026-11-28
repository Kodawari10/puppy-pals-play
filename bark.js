/* "Bark Along" mini-game: four pups (one toy, one small, one large, one giant) bark a little tune,
   and you bark it back in the same order. Every round adds one more bark. Best streak is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var SIZES = ["toy", "small", "large", "giant"], COLORS = ["pink", "sun", "mint", "lilac"];
  var BEST_KEY = "puppyPals.barkBest", STEP = 620, GAP = 220;
  var dlg = $("bark"), padsEl = $("bpads"), g = null, timers = [], speed = 1;
  function best() { var n = parseInt(localStorage.getItem(BEST_KEY), 10); return isNaN(n) || n < 0 || n > 999 ? 0 : n; }
  function setBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {} }
  function sfx(n, b) { if (window.PuppySound) PuppySound.play(n, b); }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b).replace(/<title>[\s\S]*?<\/title>/, ""); }
  function bestLabel() { var b = best(); $("barkbest").textContent = b ? "Best: " + b + " 🎵" : ""; }
  function later(fn, ms) { timers.push(setTimeout(fn, Math.round(ms * speed))); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function say(t, cls) { var f = $("bfb"); f.textContent = t; f.className = "qfb" + (cls ? " " + cls : ""); }
  function pick(size, avoid) {
    var list = B.filter(function (b) { return b.size === size && avoid.indexOf(b.id) < 0; });
    return list[Math.floor(Math.random() * list.length)];
  }
  // one pup per voice, so every pad sounds different: tiny yips up to a giant woof
  function choosePups(ids) {
    var out = [];
    SIZES.forEach(function (s, i) {
      var want = ids && ids[i] && B.find(function (b) { return b.id === ids[i]; });
      out.push(want || pick(s, out.map(function (b) { return b.id; })));
    });
    return out;
  }
  function hud() {
    $("blevel").textContent = "🎵 Round " + (g.seq.length || 1);
    $("bscore").textContent = "⭐ " + g.score;
    $("bbar").style.width = Math.min(100, g.score / Math.max(best(), 8) * 100) + "%";
  }
  function setTurn(yours) {
    g.yours = yours;
    padsEl.classList.toggle("listening", !yours);
    padsEl.setAttribute("aria-busy", String(!yours));
  }
  function light(i, cls) {
    var el = padsEl.children[i]; if (!el) return;
    el.classList.remove("lit", "miss"); void el.offsetWidth; el.classList.add(cls || "lit");
    var ms = cls === "miss" ? 700 : STEP * 0.7;
    later(function () { el.classList.remove(cls || "lit"); }, ms);
  }
  function buildPads() {
    padsEl.innerHTML = "";
    g.pups.forEach(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "bpad " + COLORS[i]; btn.dataset.i = i;
      btn.setAttribute("aria-label", (i + 1) + ": " + b.name);
      btn.innerHTML = '<span class="bart" aria-hidden="true">' + art(b) + '</span><span class="bname"><span class="qk">' + (i + 1) + "</span>" + b.name + "</span>";
      btn.addEventListener("click", function () { tap(i); });
      padsEl.appendChild(btn);
    });
  }
  function playSeq() {
    setTurn(false); clearTimers();
    var n = g.seq.length, pace = Math.max(0.6, 1 - (n - 1) * 0.05); // gently speeds up
    say("👂 Listen… " + n + " bark" + (n === 1 ? "" : "s"));
    g.seq.forEach(function (idx, k) {
      later(function () { light(idx); sfx("bark", g.pups[idx]); }, 500 + k * (STEP + GAP) * pace);
    });
    later(function () {
      g.pos = 0; setTurn(true);
      say("🐾 Your turn! Bark it back.", "");
      $("blive").textContent = "Your turn. The tune was: " + g.seq.map(function (i) { return g.pups[i].name; }).join(", ") + ".";
    }, 500 + n * (STEP + GAP) * pace);
  }
  function next() { g.seq.push(Math.floor(Math.random() * 4)); hud(); playSeq(); }
  function tap(i) {
    if (!g || g.over || !g.yours || i < 0 || i > 3) return false;
    light(i); 
    if (g.seq[g.pos] !== i) { fail(i); return false; }
    sfx("bark", g.pups[i]); g.pos++;
    if (g.pos === g.seq.length) {
      g.score = g.seq.length; setTurn(false); hud();
      var cheers = ["Pawfect! 🎶", "Woof woof, yes! 💕", "What a choir! ✨", "So good! 🐶", "Encore! 🎤"];
      say(cheers[(g.score - 1) % cheers.length] + " Round " + g.score + " done.", "good");
      later(function () { sfx("yay"); }, 260);
      later(next, 1100);
    }
    return true;
  }
  function fail(i) {
    var want = g.seq[g.pos];
    setTurn(false); g.over = true; clearTimers();
    sfx("oops"); light(i, "miss"); light(want);
    say("Oops! That was " + g.pups[i].name + ", but it was " + g.pups[want].name + "'s turn. 💔", "bad");
    later(end, 1300);
  }
  function end() {
    clearTimers();
    var prev = best(), isNew = g.score > prev;
    if (isNew) setBest(g.score);
    $("bplay").hidden = true; $("bdone").hidden = false;
    var star = g.pups[g.seq[g.seq.length - 1]] || g.pups[0];
    $("bart").innerHTML = art(star);
    $("bfinal").textContent = g.score + " round" + (g.score === 1 ? "" : "s") + " in a row";
    $("bmsg").textContent = isNew && g.score ? (prev ? "New best! You beat " + prev + " 🎉" : "That's your first best score 🎉") :
      g.score ? "The pups loved singing with you! Your best is " + Math.max(prev, g.score) + "." : "Practice makes pawfect. Try again!";
    if (g.score) sfx("fanfare");
    bestLabel();
    $("bagain").focus({ preventScroll: true });
  }
  function start(ids, seq) {
    clearTimers();
    g = { pups: choosePups(ids), seq: [], pos: 0, score: 0, yours: false, over: false };
    buildPads();
    $("bplay").hidden = false; $("bdone").hidden = true;
    if (seq && seq.length) { g.seq = seq.slice(); hud(); playSeq(); } else next();
  }
  document.addEventListener("keydown", function (e) {
    if (!dlg.open || !g) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); tap(n - 1); }
  });
  $("barkbtn").onclick = function () { dlg.showModal(); start(); };
  $("bclose").onclick = function () { dlg.close(); };
  $("bagain").onclick = function () { start(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { clearTimers(); g = null; $("barkbtn").focus({ preventScroll: true }); });
  bestLabel();
  window.PuppyBark = {
    start: start, tap: tap, best: best, SIZES: SIZES,
    speed: function (v) { speed = v > 0 ? v : 1; },
    state: function () { return g && { pups: g.pups.map(function (b) { return b.id; }), seq: g.seq.slice(), pos: g.pos, score: g.score, yours: g.yours, over: g.over }; }
  };
})();
