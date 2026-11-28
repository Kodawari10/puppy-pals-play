/* 🔍 Odd Pup Out: 8 rounds of four pups where three share something (their group, their part of the world or their size)
   and one doesn't. Find the odd one! 💡 Hint tells you what to look at; pups found without a hint earn a ⭐. Best stars in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 8, KEY = "puppyPals.oddBest";
  var KINDS = [
    { key: "group", hint: "💡 Look at what job each pup does (its group).", same: function (v) { return "Three are " + v + " pups"; } },
    { key: "region", hint: "💡 Look at where in the world each pup comes from.", same: function (v) { return "Three come from " + place(v); } },
    { key: "size", hint: "💡 Look at how big each pup is.", same: function (v) { return "Three are " + v + "-sized"; } }
  ];
  function place(r) { return r === "Americas" ? "the Americas" : r; }
  var dlg = $("odd"), g = null;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function best() { var n; try { n = parseInt(localStorage.getItem(KEY), 10); } catch (e) {} return isNaN(n) ? 0 : Math.max(0, Math.min(ROUNDS, n)); }
  function label() { var b = best(); $("oddbest").textContent = b ? "Best: " + b + "⭐" : ""; }
  function kindOf(k) { return KINDS.filter(function (x) { return x.key === k; })[0]; }
  // three pups that share a value, plus one that differs; the three must not ALSO all share the odd pup's other traits,
  // so there's exactly one sensible answer for that rule
  function makeRound(kind) {
    kind = kind || KINDS[Math.floor(Math.random() * KINDS.length)];
    var vals = {}; B.forEach(function (b) { (vals[b[kind.key]] = vals[b[kind.key]] || []).push(b); });
    var keys = shuffle(Object.keys(vals).filter(function (v) { return vals[v].length >= 3; }));
    for (var tries = 0; tries < 60; tries++) {
      var v = keys[tries % keys.length], three = shuffle(vals[v]).slice(0, 3);
      var odd = shuffle(B.filter(function (b) { return b[kind.key] !== v; }))[0], four = three.concat([odd]);
      if (tries < 59 && otherOdd(four, kind.key, odd)) continue;
      return { kind: kind.key, value: v, odd: odd.id, pups: shuffle(four).map(function (b) { return b.id; }) };
    }
  }
  // true if another rule would make a DIFFERENT pup the odd one out (three match, one doesn't)
  function otherOdd(four, key, odd) {
    return KINDS.some(function (k) {
      if (k.key === key) return false;
      var c = {}; four.forEach(function (b) { c[b[k.key]] = (c[b[k.key]] || 0) + 1; });
      var vs = Object.keys(c); if (vs.length !== 2) return false;
      var lone = vs.filter(function (x) { return c[x] === 1; })[0]; if (lone == null) return false;
      return four.filter(function (b) { return b[k.key] === lone; })[0] !== odd;
    });
  }
  function pup(id) { return B.filter(function (b) { return b.id === id; })[0]; }
  function start() {
    var kinds = shuffle([].concat(KINDS, KINDS, KINDS)).slice(0, ROUNDS);
    g = { rounds: kinds.map(function (k) { return makeRound(k); }), i: 0, stars: 0, right: 0, hinted: false, locked: false };
    $("oplay").hidden = false; $("odone").hidden = true; round();
  }
  function round() {
    var r = g.rounds[g.i]; g.locked = false; g.hinted = false;
    $("oprog").textContent = "Round " + (g.i + 1) + " of " + ROUNDS;
    $("ostars").textContent = "⭐ " + g.stars;
    $("obar").style.width = (g.i / ROUNDS * 100) + "%";
    $("ohint").disabled = false; $("ohinttext").textContent = "";
    $("ofb").textContent = ""; $("ofb").className = "qfb";
    $("onext").hidden = true;
    var box = $("opups"); box.innerHTML = "";
    r.pups.forEach(function (id, k) {
      var b = pup(id), btn = document.createElement("button");
      btn.type = "button"; btn.className = "opup"; btn.dataset.id = id;
      btn.setAttribute("aria-label", (k + 1) + ": " + b.name);
      btn.innerHTML = '<span class="qk" aria-hidden="true">' + (k + 1) + '</span><span class="oart" aria-hidden="true">' + DogArt.svg(b, { id: "odd-" + id, title: false }) + '</span><span class="oname">' + b.name + '</span><span class="otag" aria-hidden="true"></span>';
      btn.onclick = function () { pick(id, btn); };
      box.appendChild(btn);
    });
    box.firstChild.focus({ preventScroll: true });
  }
  function hint() {
    if (!g || g.locked || g.hinted) return;
    g.hinted = true; $("ohint").disabled = true;
    $("ohinttext").textContent = kindOf(g.rounds[g.i].kind).hint;
    if (window.PuppySound) PuppySound.play("pop");
  }
  function pick(id, btn) {
    if (!g || g.locked) return; g.locked = true;
    var r = g.rounds[g.i], k = kindOf(r.kind), odd = pup(r.odd), ok = id === r.odd;
    if (ok) { g.right++; if (!g.hinted) g.stars++; }
    $("opups").querySelectorAll(".opup").forEach(function (o) {
      o.disabled = true; var b = pup(o.dataset.id);
      o.querySelector(".otag").textContent = r.kind === "size" ? b.size : b[r.kind];
      o.classList.add(o.dataset.id === r.odd ? "isodd" : "same");
    });
    if (!ok) btn.classList.add("wrong");
    $("ohint").disabled = true;
    if (window.PuppySound) PuppySound.play(ok ? "yay" : "oops");
    $("ostars").textContent = "⭐ " + g.stars;
    var why = k.same(r.value) + ", but the " + odd.name + " is " + (r.kind === "group" ? "a " + odd.group + " pup" : r.kind === "region" ? "from " + place(odd.region) : odd.size + "-sized") + ".";
    $("ofb").className = "qfb " + (ok ? "good" : "bad");
    $("ofb").textContent = (ok ? (g.hinted ? "You found it! " : "⭐ Sharp eyes! ") : "Not this time! ") + why;
    $("onext").textContent = g.i === ROUNDS - 1 ? "See stars ⭐" : "Next round →";
    $("onext").hidden = false; $("onext").focus({ preventScroll: true });
  }
  function next() {
    if (!g) return;
    if (g.i < ROUNDS - 1) { g.i++; round(); return; }
    $("obar").style.width = "100%";
    var prev = best(), isNew = g.stars > prev;
    if (isNew) { try { localStorage.setItem(KEY, String(g.stars)); } catch (e) {} }
    $("oplay").hidden = true; $("odone").hidden = false;
    $("ofinal").textContent = g.stars + " ⭐ · " + g.right + " / " + ROUNDS + " found";
    $("omsg").textContent = (g.right === ROUNDS ? (g.stars === ROUNDS ? "Perfect detective! 🕵️🏆" : "You found every odd pup! 🔍") : g.right >= 5 ? "Great detective work! 🐾" : "Good sniffing! Try 💡 hints and play again. 💕") + (isNew && prev ? " New best!" : "");
    if (window.PuppySound) PuppySound.play(g.right >= ROUNDS / 2 ? "fanfare" : "pop");
    label(); $("oagain").focus({ preventScroll: true });
  }
  $("oddbtn").onclick = function () { start(); dlg.showModal(); $("opups").firstChild.focus({ preventScroll: true }); };
  $("onext").onclick = next; $("oagain").onclick = start; $("ohint").onclick = hint;
  $("oclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("oddbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!g || $("oplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "?" || e.key === "h" || e.key === "H") { e.preventDefault(); hint(); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !g.locked) { var o = $("opups").querySelectorAll(".opup")[n - 1]; if (o) { e.preventDefault(); o.click(); } }
  });
  label();
  window.PuppyOdd = { rounds: ROUNDS, makeRound: function (k) { return makeRound(kindOf(k)); }, state: function () { return g; } };
})();
