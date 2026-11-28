/* "Treat Catch" mini-game: move a pup left and right to catch falling treats for 30 seconds.
   Chocolate and grapes aren't safe for dogs, so catching one costs a heart. Best score is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var TIME = 30, HEARTS = 3, BEST_KEY = "puppyPals.catchBest", REACH = 0.13, CATCH_Y = 0.8, PUP_SPEED = 1.25;
  var KINDS = {
    bone: { emoji: "🦴", pts: 1, name: "a bone" },
    meat: { emoji: "🍖", pts: 1, name: "a meaty treat" },
    dango: { emoji: "🍡", pts: 2, name: "dango" },
    star: { emoji: "⭐", pts: 3, name: "a lucky star" },
    choco: { emoji: "🍫", bad: true, name: "chocolate", tip: "Chocolate isn't safe for pups!" },
    grape: { emoji: "🍇", bad: true, name: "grapes", tip: "Grapes aren't safe for pups!" }
  };
  var dlg = $("catch"), stage = $("kstage"), pupEl = $("kpup"), g = null, raf = 0, last = 0, manual = false, nid = 0;
  function best() { var n = parseInt(localStorage.getItem(BEST_KEY), 10); return isNaN(n) || n < 0 ? 0 : n; }
  function setBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {} }
  function sfx(n, b) { if (window.PuppySound) PuppySound.play(n, b); }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b).replace(/<title>[\s\S]*?<\/title>/, ""); }
  function bestLabel() { var b = best(); $("catchbest").textContent = b ? "Best: " + b + " 🦴" : ""; }
  function clamp(x) { return Math.max(0.08, Math.min(0.92, x)); }
  function say(t, cls) { var f = $("kfb"); f.textContent = t; f.className = "qfb" + (cls ? " " + cls : ""); }
  function hud() {
    $("kscore").textContent = "🦴 " + g.score;
    $("khearts").textContent = "💖".repeat(g.hearts) + "🤍".repeat(HEARTS - g.hearts);
    $("khearts").setAttribute("aria-label", g.hearts + " of " + HEARTS + " hearts left");
    var s = Math.ceil(g.left);
    $("ktime").textContent = "⏱ " + s + "s";
    $("kbar").style.width = (g.left / TIME * 100) + "%";
  }
  function pickKind(r) {
    // about 1 in 6 drops is something pups shouldn't eat; stars are rare
    return r < 0.1 ? "choco" : r < 0.17 ? "grape" : r < 0.23 ? "star" : r < 0.43 ? "dango" : r < 0.7 ? "meat" : "bone";
  }
  function drop(kind, x) {
    if (!g || !KINDS[kind]) return null;
    var el = document.createElement("span");
    el.className = "ktreat" + (KINDS[kind].bad ? " bad" : "");
    el.textContent = KINDS[kind].emoji; el.setAttribute("aria-hidden", "true");
    var it = { id: ++nid, kind: kind, x: x == null ? 0.08 + Math.random() * 0.84 : clamp(x), y: -0.08, el: el };
    stage.appendChild(el); g.items.push(it); place(it);
    return it.id;
  }
  function place(it) { it.el.style.left = (it.x * 100) + "%"; it.el.style.top = (it.y * 100) + "%"; }
  function placePup() { pupEl.style.left = (g.x * 100) + "%"; pupEl.classList.toggle("left", g.face < 0); }
  function moveTo(x) { if (!g || g.over) return; var nx = clamp(x); if (nx !== g.x) g.face = nx < g.x ? -1 : 1; g.x = nx; placePup(); }
  function chomp(cls) { pupEl.classList.remove("chomp", "yuck"); void pupEl.offsetWidth; pupEl.classList.add(cls); }
  function caught(it) {
    var k = KINDS[it.kind];
    if (k.bad) {
      g.hearts--; g.oops++;
      chomp("yuck"); sfx("oops"); say("Oh no, " + k.name + "! " + k.tip + " 💔", "bad");
      stage.classList.remove("hurt"); void stage.offsetWidth; stage.classList.add("hurt");
    } else {
      g.score += k.pts; g.caught++;
      chomp("chomp"); sfx(it.kind === "star" ? "yay" : "pop");
      var pop = document.createElement("span"); pop.className = "kpts"; pop.textContent = "+" + k.pts; pop.setAttribute("aria-hidden", "true");
      pop.style.left = (it.x * 100) + "%"; stage.appendChild(pop); setTimeout(function () { pop.remove(); }, 700);
      if (it.kind === "star") say("A lucky star! +3 ✨", "good");
      else if (g.caught % 5 === 0) say(g.pup.name + " has caught " + g.caught + " treats! " + ["Yum!", "Nom nom!", "So good!", "Woof!"][(g.caught / 5) % 4], "good");
    }
    hud();
    if (g.hearts <= 0) end();
  }
  function step(dt) {
    if (!g || g.over) return;
    dt = Math.min(dt, 0.1);
    g.t += dt; g.left = Math.max(0, TIME - g.t);
    if (g.dir) moveTo(g.x + g.dir * PUP_SPEED * dt);
    var speed = 0.38 + 0.4 * (g.t / TIME);
    if (!manual) {
      g.spawnIn -= dt;
      if (g.spawnIn <= 0) { drop(pickKind(Math.random())); g.spawnIn = 0.95 - 0.45 * (g.t / TIME); }
    }
    for (var i = g.items.length - 1; i >= 0; i--) {
      var it = g.items[i], py = it.y;
      it.y += speed * dt;
      if (py < CATCH_Y && it.y >= CATCH_Y && Math.abs(it.x - g.x) <= REACH) { it.el.remove(); g.items.splice(i, 1); caught(it); if (g.over) return; continue; }
      if (it.y > 1.08) { it.el.remove(); g.items.splice(i, 1); continue; }
      place(it);
    }
    hud();
    if (g.left <= 0) end();
  }
  function loop(now) {
    raf = 0;
    if (!g || g.over || !dlg.open) return;
    if (!manual && !document.hidden) step(last ? (now - last) / 1000 : 0);
    last = now; raf = requestAnimationFrame(loop);
  }
  function clearItems() { stage.querySelectorAll(".ktreat,.kpts").forEach(function (e) { e.remove(); }); }
  function start(id) {
    cancelAnimationFrame(raf); raf = 0; last = 0; clearItems();
    var pup = (id && B.find(function (b) { return b.id === id; })) || B[Math.floor(Math.random() * B.length)];
    g = { pup: pup, x: 0.5, face: 1, dir: 0, score: 0, caught: 0, oops: 0, hearts: HEARTS, t: 0, left: TIME, items: [], spawnIn: 0.6, over: false };
    pupEl.innerHTML = art(pup); pupEl.setAttribute("aria-label", pup.name);
    $("kplay").hidden = false; $("kdone").hidden = true; stage.classList.remove("hurt");
    say(pup.name + " is hungry! Catch the treats, skip the 🍫 and 🍇.");
    placePup(); hud();
    stage.focus({ preventScroll: true });
    sfx("bark", pup);
    raf = requestAnimationFrame(loop);
  }
  function end() {
    if (!g || g.over) return;
    g.over = true; g.dir = 0; cancelAnimationFrame(raf); raf = 0; clearItems(); g.items = [];
    var prev = best(), isNew = g.score > prev;
    if (isNew) setBest(g.score);
    $("kplay").hidden = true; $("kdone").hidden = false;
    $("kart").innerHTML = art(g.pup);
    $("kfinal").textContent = g.score + " treat point" + (g.score === 1 ? "" : "s");
    var why = g.hearts <= 0 ? "Too many tummy aches! " : "Time's up! ";
    $("kmsg").textContent = why + (isNew && g.score ? (prev ? "New best! You beat " + prev + " 🎉" : "That's your first best score 🎉") :
      g.score ? g.pup.name + " is full and happy. Your best is " + Math.max(prev, g.score) + "." : "Let's try again, " + g.pup.name + " is still hungry!");
    sfx(g.score ? "fanfare" : "oops");
    bestLabel();
    $("kagain").focus({ preventScroll: true });
  }
  // controls: drag or tap on the stage, arrow keys / A and D, or the big ◀ ▶ buttons on phones
  function fromPointer(e) { var r = stage.getBoundingClientRect(); if (r.width) moveTo((e.clientX - r.left) / r.width); }
  var dragging = false;
  stage.addEventListener("pointerdown", function (e) { if (!g || g.over) return; dragging = true; try { stage.setPointerCapture(e.pointerId); } catch (x) {} fromPointer(e); });
  stage.addEventListener("pointermove", function (e) { if (dragging) fromPointer(e); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (t) { stage.addEventListener(t, function () { dragging = false; }); });
  var KEYS = { ArrowLeft: -1, ArrowRight: 1, a: -1, A: -1, d: 1, D: 1 };
  dlg.addEventListener("keydown", function (e) {
    var d = KEYS[e.key]; if (!d || !g || g.over || e.target.tagName === "BUTTON" && e.target.id !== "kleft" && e.target.id !== "kright") return;
    e.preventDefault(); g.dir = d;
  });
  dlg.addEventListener("keyup", function (e) { var d = KEYS[e.key]; if (d && g && g.dir === d) g.dir = 0; });
  [["kleft", -1], ["kright", 1]].forEach(function (p) {
    var b = $(p[0]);
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); if (g && !g.over) g.dir = p[1]; });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) { b.addEventListener(t, function () { if (g && g.dir === p[1]) g.dir = 0; }); });
    b.addEventListener("click", function (e) { if (e.detail === 0 && g && !g.over) moveTo(g.x + p[1] * 0.12); }); // keyboard Enter/Space nudges
    b.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  });
  $("catchbtn").onclick = function () { dlg.showModal(); start(); };
  $("kclose").onclick = function () { dlg.close(); };
  $("kagain").onclick = function () { start(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { cancelAnimationFrame(raf); raf = 0; clearItems(); g = null; $("catchbtn").focus({ preventScroll: true }); });
  bestLabel();
  window.PuppyCatch = {
    start: start, step: step, drop: drop, move: moveTo, end: end, best: best, pickKind: pickKind, KINDS: KINDS, TIME: TIME, HEARTS: HEARTS, CATCH_Y: CATCH_Y, REACH: REACH,
    manual: function (v) { manual = !!v; },
    state: function () { return g && { pup: g.pup.id, x: g.x, score: g.score, hearts: g.hearts, left: g.left, over: g.over, dir: g.dir, items: g.items.map(function (i) { return { kind: i.kind, x: i.x, y: i.y }; }) }; }
  };
})();
