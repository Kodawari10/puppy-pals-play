/* 🙈 Hide-and-Seek: a pup hides in a cosy room. Peek behind the furniture to find it!
   5 rounds, keys 1–6, a hint after two misses, fewest peeks saved in localStorage (puppyPals.hideBest). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 5, KEY = "puppyPals.hideBest";
  var SPOTS = [
    { id: "curtain", emoji: "🪟", name: "the window", label: "Window", hint: "near the window" },
    { id: "door", emoji: "🚪", name: "the door", label: "Door", hint: "by the doorway" },
    { id: "plant", emoji: "🪴", name: "the plant", label: "Plant", hint: "behind the leaves" },
    { id: "sofa", emoji: "🛋️", name: "the sofa", label: "Sofa", hint: "under the cushions" },
    { id: "box", emoji: "📦", name: "the box", label: "Box", hint: "inside a box" },
    { id: "bed", emoji: "🛏️", name: "the bed", label: "Bed", hint: "under the blankets" }
  ];
  var NEXT = { curtain: ["door", "sofa"], door: ["curtain", "plant", "box"], plant: ["door", "bed"], sofa: ["curtain", "box"], box: ["sofa", "door", "bed"], bed: ["box", "plant"] };
  var dlg = $("hide"), g = null;
  function byId(id) { return SPOTS.filter(function (s) { return s.id === id; })[0]; }
  function pup(id) { return B.filter(function (b) { return b.id === id; })[0]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function best() { var n; try { n = parseInt(localStorage.getItem(KEY), 10); } catch (e) {} return isNaN(n) ? 0 : Math.max(0, Math.min(60, n)); }
  function label() { var b = best(); $("hidebest").textContent = b ? "Best: " + b + " peeks" : ""; }
  function pickPups() {
    var met = window.PuppyPals ? PuppyPals.met() : [];
    var friends = shuffle(B.filter(function (b) { return met.indexOf(b.id) >= 0; }));
    var rest = shuffle(B.filter(function (b) { return met.indexOf(b.id) < 0; }));
    return friends.concat(rest).slice(0, ROUNDS);
  }
  function start() {
    g = { pups: pickPups(), spots: [], i: 0, peeks: 0, misses: 0, locked: false, found: false };
    for (var k = 0; k < ROUNDS; k++) g.spots.push(SPOTS[Math.floor(Math.random() * SPOTS.length)].id);
    $("hiplay").hidden = false; $("hidone").hidden = true; $("hifb").textContent = ""; $("hifb").className = "qfb";
    $("hinext").hidden = true; round();
  }
  function round() {
    g.locked = false; g.found = false; g.misses = 0;
    $("hiprog").textContent = "Pup " + (g.i + 1) + " of " + ROUNDS;
    $("hipeeks").textContent = "👀 " + g.peeks;
    $("hibar").style.width = (g.i / ROUNDS * 100) + "%";
    $("hiwho").textContent = "A pup is hiding! Where could it be?";
    $("hifb").textContent = ""; $("hifb").className = "qfb";
    $("hinext").hidden = true; $("hihint").disabled = true; $("hihint").hidden = true;
    paintSpots();
    $("hispots").querySelector(".hispot").focus({ preventScroll: true });
  }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b, { id: "hide-" + b.id, title: false }); }
  function paintSpots() {
    $("hispots").innerHTML = SPOTS.map(function (s, k) {
      var show = g.found && s.id === g.spots[g.i];
      return '<button type="button" class="hispot' + (show ? " found" : "") + (g.tried && g.tried[s.id] && !show ? " empty" : "") + '" data-id="' + s.id + '" data-k="' + (k + 1) + '" ' + (g.locked ? "disabled" : "") + ' aria-label="' + (k + 1) + ": Look " + (s.id === "box" || s.id === "bed" || s.id === "sofa" ? "under " : "behind ") + s.name + '">' +
        '<span class="hik" aria-hidden="true">' + (k + 1) + '</span><span class="hiemoji" aria-hidden="true">' + s.emoji + '</span>' +
        (show ? '<span class="hiart" aria-hidden="true">' + art(pup(g.pups[g.i].id)) + "</span>" : "") +
        '<span class="hilbl">' + s.label + "</span></button>";
    }).join("");
  }
  function peek(id) {
    if (!g || g.locked) return;
    var s = byId(id); if (!s) return;
    g.peeks++; $("hipeeks").textContent = "👀 " + g.peeks;
    if (id === g.spots[g.i]) return found();
    g.misses++;
    g.tried = g.tried || {}; g.tried[id] = 1;
    var spot = $("hispots").querySelector('[data-id="' + id + '"]');
    if (spot) { spot.classList.remove("shake"); void spot.offsetWidth; spot.classList.add("shake", "empty"); }
    if (window.PuppySound) PuppySound.play("oops");
    var near = NEXT[id] && NEXT[id].indexOf(g.spots[g.i]) >= 0;
    $("hifb").className = "qfb";
    $("hifb").textContent = "Not " + s.name + "! " + (near ? "But you're getting warmer… 🔥" : "Keep looking! 👀");
    $("hilive").textContent = "Nobody behind " + s.name + "." + (near ? " Getting warmer." : "");
    if (g.misses >= 2) {
      $("hihint").hidden = false; $("hihint").disabled = false;
    }
  }
  function hint() {
    if (!g || g.found) return;
    var s = byId(g.spots[g.i]);
    $("hifb").className = "qfb";
    $("hifb").textContent = "Hint: try looking " + s.hint + "… 🤫";
    $("hilive").textContent = "Hint: look " + s.hint + ".";
    $("hihint").disabled = true;
    if (window.PuppySound) PuppySound.play("pop");
  }
  function found() {
    g.locked = true; g.found = true;
    var b = g.pups[g.i], s = byId(g.spots[g.i]);
    paintSpots();
    if (window.PuppySound) { PuppySound.play("yay"); setTimeout(function () { PuppySound.play("bark", b); }, 280); }
    $("hiwho").textContent = "Found you, " + b.name + "! 🎉";
    $("hifb").className = "qfb good";
    $("hifb").textContent = "There you are! The " + b.name + " was hiding " + (s.id === "box" ? "in " : s.id === "bed" || s.id === "sofa" ? "under " : "behind ") + s.name + ".";
    $("hilive").textContent = "Found the " + b.name + " " + (s.id === "box" ? "in " : "behind ") + s.name + ".";
    $("hinext").textContent = g.i === ROUNDS - 1 ? "See score 👀" : "Next hide →";
    $("hinext").hidden = false; $("hihint").hidden = true;
    $("hinext").focus({ preventScroll: true });
  }
  function next() {
    if (!g) return;
    g.tried = {};
    if (g.i < ROUNDS - 1) { g.i++; round(); return; }
    $("hibar").style.width = "100%";
    var prev = best(), isNew = !prev || g.peeks < prev;
    if (isNew) { try { localStorage.setItem(KEY, String(g.peeks)); } catch (e) {} }
    $("hiplay").hidden = true; $("hidone").hidden = false;
    $("hifinal").textContent = g.peeks + " peeks";
    $("himsg").textContent = (g.peeks === ROUNDS ? "Perfect! You found every pup on the first peek! 🏆" : g.peeks <= ROUNDS + 3 ? "Wow, sharp eyes! 👀" : g.peeks <= ROUNDS + 8 ? "Great seeking! The pups had fun hiding. 🐾" : "Nice searching! Try the hint next time. 💕") + (isNew && prev ? " New best!" : "");
    if (window.PuppySound) PuppySound.play(g.peeks <= ROUNDS + 3 ? "fanfare" : "pop");
    label(); $("hiagain").focus({ preventScroll: true });
  }
  $("hispots").addEventListener("click", function (e) { var t = e.target.closest(".hispot"); if (t) peek(t.dataset.id); });
  $("hihint").onclick = hint;
  $("hinext").onclick = next;
  $("hiagain").onclick = start;
  $("hidebtn").onclick = function () { dlg.showModal(); start(); };
  $("hiclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("hidebtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!g || $("hiplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === "?" || e.key === "h" || e.key === "H") && !g.found) { e.preventDefault(); if (!$("hihint").hidden) hint(); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6 && !g.locked) { var o = $("hispots").querySelectorAll(".hispot")[n - 1]; if (o) { e.preventDefault(); peek(o.dataset.id); } }
  });
  label();
  window.PuppyHide = { rounds: ROUNDS, spots: function () { return SPOTS.map(function (s) { return s.id; }); }, start: start, peek: peek, hint: hint, state: function () { return g; }, next: next };
})();
