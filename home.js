/* 🧭 Where's my home?: 8 rounds, a pup shows up and you pick the country it comes from out of four flags.
   A right answer says hello in that country's language. Best score is kept in localStorage (puppyPals.homeBest). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 8, KEY = "puppyPals.homeBest";
  var dlg = $("home"), g = null;
  function countries() { return window.PuppyWorld ? PuppyWorld.countries() : []; }
  function byId(id) { return countries().filter(function (c) { return c.id === id; })[0] || null; }
  // a pup's home is the first country it belongs to; pups from several countries accept any of them
  function homesOf(b) { return window.PuppyWorld ? PuppyWorld.countriesOf(b) : []; }
  function regionOf(c) { var b = B.filter(function (x) { return x.id === c.pups[0]; })[0]; return b ? b.region : ""; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function best() { var n; try { n = parseInt(localStorage.getItem(KEY), 10); } catch (e) {} return isNaN(n) ? 0 : Math.max(0, Math.min(ROUNDS, n)); }
  function setBest(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }
  function label() { var b = best(); $("homebest").textContent = b ? "Best: " + b + "/" + ROUNDS : ""; }
  // one wrong flag from the same part of the world (a little tricky), the others from anywhere else
  function choicesFor(b) {
    var homes = homesOf(b), ans = byId(homes[0]), others = countries().filter(function (c) { return homes.indexOf(c.id) < 0; });
    var near = shuffle(others.filter(function (c) { return regionOf(c) === b.region; })).slice(0, 1);
    var far = shuffle(others.filter(function (c) { return near.indexOf(c) < 0; })).slice(0, 3 - near.length);
    return shuffle([ans].concat(near, far));
  }
  function pickPups() {
    // pups from as many different countries as possible
    var seen = {}, out = [];
    shuffle(B.filter(function (b) { return homesOf(b).length; })).forEach(function (b) {
      var h = homesOf(b)[0]; if (out.length < ROUNDS && !seen[h]) { seen[h] = 1; out.push(b); }
    });
    return out;
  }
  function start() {
    g = { order: pickPups(), i: 0, score: 0, locked: false, flags: [] };
    $("hplay").hidden = false; $("hdone").hidden = true; round();
  }
  function round() {
    var b = g.order[g.i]; g.locked = false;
    $("hprog").textContent = "Pup " + (g.i + 1) + " of " + ROUNDS;
    $("hscore").textContent = "★ " + g.score;
    $("hbar").style.width = (g.i / ROUNDS * 100) + "%";
    $("hart").innerHTML = DogArt.svg(b, { id: "home-" + b.id, title: false });
    $("hart").setAttribute("aria-label", b.name);
    $("hart").classList.remove("yay", "oops");
    $("hq").textContent = "Where does the " + b.name + " come from?";
    $("hfb").textContent = ""; $("hfb").className = "qfb";
    $("hnext").hidden = true;
    var box = $("hopts"); box.innerHTML = "";
    choicesFor(b).forEach(function (c, k) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "qopt hopt"; btn.dataset.id = c.id;
      btn.innerHTML = '<span class="qk">' + (k + 1) + '</span><span class="hflag" aria-hidden="true">' + c.flag + "</span>" + c.name;
      btn.onclick = function () { pick(c, btn); };
      box.appendChild(btn);
    });
    box.firstChild.focus({ preventScroll: true });
  }
  function pick(c, btn) {
    if (!g || g.locked) return; g.locked = true;
    var b = g.order[g.i], homes = homesOf(b), ok = homes.indexOf(c.id) >= 0, home = ok ? c : byId(homes[0]);
    if (ok) { g.score++; g.flags.push(c.flag); }
    $("hopts").querySelectorAll(".hopt").forEach(function (o) { o.disabled = true; if (homes.indexOf(o.dataset.id) >= 0) o.classList.add("right"); });
    if (!ok) btn.classList.add("wrong");
    $("hart").classList.add(ok ? "yay" : "oops");
    if (window.PuppySound) PuppySound.play(ok ? "yay" : "oops");
    $("hscore").textContent = "★ " + g.score;
    $("hfb").className = "qfb " + (ok ? "good" : "bad");
    $("hfb").textContent = ok ? "“" + home.hi + "” " + home.flag + " Yes! The " + b.name + " is from " + b.origin + "." : "Not quite! The " + b.name + " is from " + b.origin + " " + home.flag + ", where they say “" + home.hi + "”";
    $("hnext").textContent = g.i === ROUNDS - 1 ? "See score ★" : "Next pup →";
    $("hnext").hidden = false; $("hnext").focus({ preventScroll: true });
  }
  function next() {
    if (!g) return;
    if (g.i < ROUNDS - 1) { g.i++; round(); return; }
    $("hbar").style.width = "100%";
    var prev = best(), isNew = g.score > prev;
    if (isNew) setBest(g.score);
    $("hplay").hidden = true; $("hdone").hidden = false;
    $("hfinal").textContent = g.score + " / " + ROUNDS;
    $("hstamps").textContent = g.flags.length ? "🛂 " + g.flags.join(" ") : "🧳";
    $("hmsg").textContent = (g.score === ROUNDS ? "Perfect! You're a world-travelling top dog! 🌍🏆" : g.score >= 6 ? "Great trip! You know where the pups live! ✈️" : g.score >= 3 ? "Nice travels! Visit 🌍 Pups around the world to learn more. 🐾" : "Bon voyage! Explore 🌍 Pups around the world and try again. 💕") + (isNew && prev ? " New best score!" : "");
    if (window.PuppySound) PuppySound.play(g.score >= ROUNDS / 2 ? "fanfare" : "pop");
    label(); $("hagain").focus({ preventScroll: true });
  }
  $("homebtn").onclick = function () { start(); dlg.showModal(); $("hopts").firstChild.focus({ preventScroll: true }); };
  $("hnext").onclick = next;
  $("hagain").onclick = start;
  $("hclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("homebtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!g || $("hplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !g.locked) { var o = $("hopts").querySelectorAll(".hopt")[n - 1]; if (o) { e.preventDefault(); o.click(); } }
  });
  label();
  window.PuppyHome = { rounds: ROUNDS, choicesFor: choicesFor, pickPups: pickPups, homesOf: homesOf, state: function () { return g; } };
})();
