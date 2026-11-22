/* "Peekaboo Pups" mini-game: pups pop up from nine flower bushes for 25 seconds; boop them before they hide.
   A golden ⭐ pup is worth 3, and the bee 🐝 should be left alone (booping it costs a point). Best score is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var TIME = 25, HOLES = 9, BEST_KEY = "puppyPals.peekBest", MAX_UP = 3;
  var dlg = $("peek"), grid = $("pkgrid"), g = null, raf = 0, last = 0, manual = false;
  function best() { var n = parseInt(localStorage.getItem(BEST_KEY), 10); return isNaN(n) || n < 0 ? 0 : n; }
  function setBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {} }
  function sfx(n, b) { if (window.PuppySound) PuppySound.play(n, b); }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b).replace(/<title>[\s\S]*?<\/title>/, ""); }
  function bestLabel() { var b = best(); $("peekbest").textContent = b ? "Best: " + b + " 🌷" : ""; }
  function say(t, cls) { var f = $("pkfb"); f.textContent = t; f.className = "qfb" + (cls ? " " + cls : ""); }
  // what pops up next: r in [0,1). Mostly pups, a few golden pups and bees.
  function pickKind(r) { return r < 0.12 ? "gold" : r < 0.27 ? "bee" : "pup"; }
  function upCount() { return g.holes.filter(Boolean).length; }
  function hud() {
    $("pkscore").textContent = "🐾 " + g.score;
    $("pktime").textContent = "⏱ " + Math.ceil(g.left) + "s";
    $("pkbar").style.width = (g.left / TIME * 100) + "%";
  }
  function holeEl(i) { return grid.children[i]; }
  function render(i) {
    var h = g.holes[i], el = holeEl(i), who = el.querySelector(".pkwho");
    el.classList.toggle("up", !!h);
    el.classList.toggle("gold", !!h && h.kind === "gold");
    el.classList.toggle("bee", !!h && h.kind === "bee");
    who.innerHTML = !h ? "" : h.kind === "bee" ? '<span class="pkbee">🐝</span>' : art(h.breed) + (h.kind === "gold" ? '<span class="pkstar">⭐</span>' : "");
    el.setAttribute("aria-label", "Bush " + (i + 1) + (!h ? ", empty" : h.kind === "bee" ? ", a bee! Leave it be" : ", " + h.breed.name + (h.kind === "gold" ? ", golden pup worth 3" : " is peeking out")));
  }
  function spawn(kind, at, breed) {
    if (!g || g.over) return -1;
    var free = []; for (var i = 0; i < HOLES; i++) if (!g.holes[i]) free.push(i);
    if (!free.length) return -1;
    var idx = at != null && !g.holes[at] ? at : free[Math.floor(Math.random() * free.length)];
    var b = breed ? B.filter(function (x) { return x.id === breed; })[0] : B[Math.floor(Math.random() * B.length)];
    kind = kind || pickKind(Math.random());
    // pups stay up a bit less as the round goes on, so it gets faster
    var life = (kind === "bee" ? 1.6 : kind === "gold" ? 0.9 : 1.3) - 0.4 * (1 - g.left / TIME);
    g.holes[idx] = { kind: kind, breed: b, life: life };
    render(idx);
    return idx;
  }
  function boop(i) {
    if (!g || g.over) return;
    var h = g.holes[i], el = holeEl(i);
    if (!h) return;
    g.holes[i] = null;
    if (h.kind === "bee") {
      g.score = Math.max(0, g.score - 1); g.bees++;
      sfx("oops"); say("Bzz! Leave the bee be 🐝", "bad");
      el.classList.add("stung"); setTimeout(function () { el.classList.remove("stung"); }, 400);
    } else {
      var pts = h.kind === "gold" ? 3 : 1;
      g.score += pts; g.boops++;
      sfx(h.kind === "gold" ? "yay" : "bark", h.breed);
      say(h.kind === "gold" ? "⭐ Golden " + h.breed.name + "! +3" : "Boop! " + h.breed.name + " +1", "good");
      el.classList.add("booped"); setTimeout(function () { el.classList.remove("booped"); }, 350);
    }
    render(i); hud();
  }
  function step(dt) {
    if (!g || g.over) return;
    g.left = Math.max(0, g.left - dt);
    for (var i = 0; i < HOLES; i++) {
      var h = g.holes[i]; if (!h) continue;
      h.life -= dt;
      if (h.life <= 0) { g.holes[i] = null; if (h.kind !== "bee") g.missed++; render(i); }
    }
    if (!manual) {
      g.next -= dt;
      if (g.next <= 0 && upCount() < MAX_UP) { spawn(); g.next = 0.85 - 0.4 * (1 - g.left / TIME); }
    }
    hud();
    if (g.left <= 0) end();
  }
  function loop(t) {
    if (!g || g.over) return;
    var dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    step(dt);
    raf = requestAnimationFrame(loop);
  }
  function build() {
    grid.innerHTML = "";
    for (var i = 0; i < HOLES; i++) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "pkhole"; btn.dataset.i = i;
      btn.innerHTML = '<span class="pkwho" aria-hidden="true"></span><span class="pkbush" aria-hidden="true">🌷</span><span class="pkn" aria-hidden="true">' + (i + 1) + "</span>";
      btn.addEventListener("pointerdown", (function (j) { return function (e) { e.preventDefault(); boop(j); }; })(i));
      btn.addEventListener("click", (function (j) { return function (e) { if (e.detail === 0) boop(j); }; })(i)); // keyboard Enter/Space
      grid.appendChild(btn);
    }
  }
  function start() {
    cancelAnimationFrame(raf); last = 0;
    g = { left: TIME, score: 0, holes: [], boops: 0, missed: 0, bees: 0, next: 0.6, over: false };
    for (var i = 0; i < HOLES; i++) g.holes.push(null);
    build();
    for (i = 0; i < HOLES; i++) render(i);
    $("pkplay").hidden = false; $("pkdone").hidden = true;
    say("Boop the pups before they hide! ⭐ = +3, skip the 🐝");
    hud();
    holeEl(4).focus({ preventScroll: true });
    if (!manual) raf = requestAnimationFrame(loop);
  }
  function end() {
    if (!g || g.over) return;
    g.over = true; cancelAnimationFrame(raf);
    for (var i = 0; i < HOLES; i++) { g.holes[i] = null; render(i); }
    var prev = best(), isNew = g.score > prev;
    if (isNew) setBest(g.score);
    $("pkplay").hidden = true; $("pkdone").hidden = false;
    $("pkfinal").textContent = g.score + " boops";
    $("pkmsg").textContent = isNew ? (prev ? "New best! You beat " + prev + " 🎉" : "Your first best score! 🎉") :
      g.score >= 20 ? "Super quick paws! Your best is " + prev + "." : "Peekaboo! Your best is " + prev + ". Try again?";
    sfx(isNew || g.score >= 10 ? "fanfare" : "pop");
    bestLabel();
    $("pkagain").focus({ preventScroll: true });
  }
  dlg.addEventListener("keydown", function (e) {
    if (!g || g.over || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) { e.preventDefault(); boop(n - 1); }
  });
  $("peekbtn").onclick = function () { start(); dlg.showModal(); };
  $("pkclose").onclick = function () { dlg.close(); };
  $("pkagain").onclick = start;
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { cancelAnimationFrame(raf); g = null; manual = false; $("peekbtn").focus({ preventScroll: true }); });
  bestLabel();
  window.PuppyPeek = {
    start: start, step: step, boop: boop, spawn: spawn, end: end, best: best, pickKind: pickKind, TIME: TIME,
    manual: function (on) { manual = !!on; if (manual) cancelAnimationFrame(raf); },
    state: function () { return g && { left: g.left, score: g.score, boops: g.boops, missed: g.missed, bees: g.bees, over: g.over, up: g.holes.map(function (h) { return h ? h.kind + ":" + h.breed.id : null; }) }; }
  };
})();
