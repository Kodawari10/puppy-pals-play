/* 🕵️ Pup Detective: "Guess Who?" for pups. The app thinks of a secret pup on a board of twelve;
   reveal factual clues (where it's from, its size, its job, what it's like) that dim the pups that don't fit,
   then tap your guess. 5 cases, a ⭐ for each one solved on the first guess. Best stars in localStorage (puppyPals.detBest). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var CASES = 5, BOARD = 12, KEY = "puppyPals.detBest";
  var dlg = $("detective"), g = null;

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pup(id) { return B.filter(function (b) { return b.id === id; })[0]; }
  function place(r) { return r === "Americas" ? "the Americas" : r; }
  function triple(b) { return b.region + "|" + b.size + "|" + b.group; }
  function best() { var n; try { n = parseInt(localStorage.getItem(KEY), 10); } catch (e) {} return isNaN(n) ? 0 : Math.max(0, Math.min(CASES, n)); }
  function setBest(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }
  function label() { var b = best(); $("detbest").textContent = b ? "Best: " + b + "⭐" : ""; }

  // Does breed b fit clue c?
  function fits(b, c) {
    if (c.k === "trait") return b.traits.indexOf(c.v) >= 0;
    return b[c.k] === c.v;
  }
  // Kid-friendly text for a clue.
  function clueText(c) {
    if (c.k === "region") return "🌍 Comes from " + place(c.v);
    if (c.k === "size") return "📏 A " + c.v + " pup";
    if (c.k === "group") return "🦴 A " + c.v + " pup";
    return "💗 This pup is " + String(c.v).toLowerCase();
  }

  // Build a board (secret + 11 others that each differ from it in region, size or group) and an ordered
  // clue list that narrows the board down to exactly the secret. Returns null if it can't (retried by caller).
  function makeCase() {
    var secret = B[Math.floor(Math.random() * B.length)];
    var others = shuffle(B.filter(function (b) { return b.id !== secret.id && triple(b) !== triple(secret); }));
    var size = Math.min(BOARD, others.length + 1);
    if (size < 4) return null;
    var board = shuffle([secret].concat(others.slice(0, size - 1)));
    // every clue that is true of the secret, core attributes first then its traits
    var pool = [{ k: "region", v: secret.region }, { k: "size", v: secret.size }, { k: "group", v: secret.group }]
      .concat(secret.traits.map(function (t) { return { k: "trait", v: t }; }));
    // Reveal clues one at a time, each ruling out a few pups, until only the secret is left.
    // At every step pick a RANDOM clue that still eliminates at least one pup (never a redundant one),
    // so the board narrows gradually with a natural, varied order instead of one all-or-nothing clue.
    var cand = board.slice(), clues = [], used = {};
    while (cand.length > 1) {
      var gentle = [], finish = [];
      pool.forEach(function (c, idx) {
        if (used[idx]) return;
        var remain = cand.filter(function (b) { return fits(b, c); }).length;
        if (remain <= 0 || remain >= cand.length) return;      // redundant: rules nobody (or everybody) out
        (remain > 1 ? gentle : finish).push({ c: c, idx: idx }); // "finish" = leaves only the secret
      });
      // prefer a clue that narrows but doesn't end it yet, so the board shrinks a few pups at a time
      var choices = gentle.length ? gentle : finish;
      if (!choices.length) return null; // no clue separates the rest (shouldn't happen given the board rule)
      var pick = choices[Math.floor(Math.random() * choices.length)];
      used[pick.idx] = true; clues.push(pick.c);
      cand = cand.filter(function (b) { return fits(b, pick.c); });
    }
    if (cand.length !== 1 || cand[0].id !== secret.id) return null;
    return { secret: secret.id, board: board.map(function (b) { return b.id; }), clues: clues };
  }
  function makeCases() {
    var out = [];
    for (var n = 0; n < CASES; n++) {
      var c = null; for (var t = 0; t < 40 && !c; t++) c = makeCase();
      if (!c) return null;
      out.push(c);
    }
    return out;
  }

  function start() {
    g = null;
    var cs = makeCases();
    if (!cs) { if (window.PuppyPals) PuppyPals.toast("The pups are hiding! Try again. 🐾"); return; }
    g = { cases: cs, i: 0, stars: 0, solved: 0 };
    $("detplay").hidden = false; $("detdone").hidden = true; round();
  }

  // pups still matching every revealed clue
  function matching(c, revealed) {
    return c.board.filter(function (id) {
      var b = pup(id);
      return c.clues.slice(0, revealed).every(function (cl) { return fits(b, cl); });
    });
  }

  function round() {
    var c = g.cases[g.i];
    g.revealed = 1; g.wrong = false; g.locked = false; g.eliminated = {};
    $("detprog").textContent = "Case " + (g.i + 1) + " of " + CASES;
    $("detstars").textContent = "⭐ " + g.stars;
    $("detbar").style.width = (g.i / CASES * 100) + "%";
    $("detfb").textContent = ""; $("detfb").className = "qfb";
    $("detnext").hidden = true;
    $("detclues").innerHTML = "";
    addClueBubble(c.clues[0]);
    updateClueBtn();
    var box = $("detboard"); box.innerHTML = "";
    c.board.forEach(function (id) {
      var b = pup(id), btn = document.createElement("button");
      btn.type = "button"; btn.className = "detpup"; btn.dataset.id = id;
      btn.setAttribute("aria-label", b.name);
      btn.innerHTML = '<span class="detart" aria-hidden="true">' + DogArt.svg(b, { id: "det-" + id, title: false }) + '</span><span class="detname">' + b.name + '</span>';
      btn.onclick = function () { guess(id, btn); };
      box.appendChild(btn);
    });
    applyClues();
    focusFirstPup();
  }

  // focus the first pup still in the running (not dimmed out), so keyboard play never lands on a dead tile
  function focusFirstPup() {
    var live = $("detboard").querySelector(".detpup:not([disabled])");
    (live || $("detclue")).focus({ preventScroll: true });
  }

  function addClueBubble(cl) {
    var li = document.createElement("span");
    li.className = "detclue"; li.textContent = clueText(cl);
    $("detclues").appendChild(li);
  }

  // dim + disable every pup that no longer fits the revealed clues
  function applyClues() {
    var c = g.cases[g.i], keep = {};
    matching(c, g.revealed).forEach(function (id) { keep[id] = true; });
    $("detboard").querySelectorAll(".detpup").forEach(function (o) {
      var out = !keep[o.dataset.id] || g.eliminated[o.dataset.id];
      o.classList.toggle("out", !!out);
      if (!g.locked) o.disabled = !!out;
    });
  }

  function updateClueBtn() {
    var c = g.cases[g.i], btn = $("detclue");
    if (g.revealed >= c.clues.length) {
      btn.disabled = true; btn.textContent = "No more clues — take your best guess! 🐾";
    } else {
      btn.disabled = false; btn.textContent = "🔎 Next clue (" + (c.clues.length - g.revealed) + " left)";
    }
  }
  function nextClue() {
    if (!g || g.locked) return;
    var c = g.cases[g.i];
    if (g.revealed >= c.clues.length) return;
    addClueBubble(c.clues[g.revealed]); g.revealed++;
    applyClues(); updateClueBtn();
    if (window.PuppySound) PuppySound.play("pop");
  }

  function guess(id, btn) {
    if (!g || g.locked) return;
    var c = g.cases[g.i];
    if (g.eliminated[id]) return;
    if (id === c.secret) {
      g.locked = true; g.solved++;
      var star = !g.wrong; if (star) g.stars++;
      $("detstars").textContent = "⭐ " + g.stars;
      $("detboard").querySelectorAll(".detpup").forEach(function (o) {
        o.disabled = true;
        if (o.dataset.id === id) o.classList.add("found"); else o.classList.add("out");
      });
      if (window.PuppySound) PuppySound.play("yay");
      var b = pup(id);
      $("detfb").className = "qfb good";
      $("detfb").textContent = (star ? "⭐ Case solved — it's the " : "You got it — it's the ") + b.name + "! 🕵️";
      $("detnext").textContent = g.i === CASES - 1 ? "See your badge ⭐" : "Next case →";
      $("detnext").hidden = false; $("detnext").focus({ preventScroll: true });
    } else {
      g.wrong = true; g.eliminated[id] = true;
      if (btn) { btn.classList.add("wrong"); btn.disabled = true; setTimeout(function () { if (btn) btn.classList.add("out"); }, 350); }
      if (window.PuppySound) PuppySound.play("oops");
      $("detfb").className = "qfb bad";
      $("detfb").textContent = "Not that one — read the clues and keep sleuthing! 🔍";
    }
  }

  function next() {
    if (!g) return;
    if (g.i < CASES - 1) { g.i++; round(); return; }
    $("detbar").style.width = "100%";
    var prev = best(), isNew = g.stars > prev;
    if (isNew) setBest(g.stars);
    $("detplay").hidden = true; $("detdone").hidden = false;
    $("detfinal").textContent = g.stars + " ⭐ · " + g.solved + " / " + CASES + " solved";
    $("detmsg").textContent = (g.stars === CASES ? "Master detective! Every case on the first guess. 🕵️🏆"
      : g.solved === CASES ? "Every case cracked! 🔍 Read one more clue next time for the ⭐." : "Good sleuthing! 🐾 The clues narrow it down — try again. 💕")
      + (isNew && prev ? " New best!" : "");
    if (window.PuppySound) PuppySound.play(g.solved >= CASES / 2 ? "fanfare" : "pop");
    label(); $("detagain").focus({ preventScroll: true });
  }

  $("detbtn").onclick = function () { start(); if (g) { dlg.showModal(); focusFirstPup(); } };
  $("detclue").onclick = nextClue; $("detnext").onclick = next; $("detagain").onclick = start;
  $("detclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("detbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!g || $("detplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "c" || e.key === "C") { e.preventDefault(); if (!g.locked) nextClue(); }
  });
  label();
  window.PuppyDetective = { cases: CASES, board: BOARD, makeCase: makeCase, fits: fits, clueText: clueText, matching: matching, state: function () { return g; } };
})();
