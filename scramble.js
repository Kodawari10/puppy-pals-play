/* "Pup Scramble": unscramble the letters to spell the pup's name. 6 pups a round, short names only.
   Tap letter tiles (or type), ⌫ / Backspace to undo, 💡 Hint places the next right letter.
   A ⭐ for every pup spelled without hints; the best round is kept in localStorage (puppyPals.scrambleBest). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 6, KEY = "puppyPals.scrambleBest", MAX = 9;
  function letters(name) { return name.toUpperCase().replace(/[^A-Z]/g, ""); }
  var POOL = B.filter(function (b) { var n = letters(b.name).length; return n >= 3 && n <= MAX; });
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // shuffle the letters, making sure they never come out already spelled right
  function scramble(word) {
    var s = word;
    for (var n = 0; n < 20 && s === word; n++) s = shuffle(word.split("")).join("");
    if (s === word) s = word.slice(1) + word[0];
    return s;
  }
  function best() { var n; try { n = parseInt(localStorage.getItem(KEY), 10); } catch (e) {} return isNaN(n) ? 0 : Math.max(0, Math.min(ROUNDS, n)); }
  function label() { var b = best(); $("scramblebest").textContent = b ? "Best: " + b + "/" + ROUNDS + " ⭐" : ""; }
  var dlg = $("scramble"), g = null;
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b); }
  function start() {
    g = { order: shuffle(POOL).slice(0, ROUNDS), i: 0, stars: 0 };
    $("splay").hidden = false; $("sdone").hidden = true;
    round();
  }
  function round() {
    var b = g.order[g.i];
    g.word = letters(b.name); g.mix = scramble(g.word); g.picked = []; g.hinted = 0; g.solved = false; g.locked = false;
    $("sprog").textContent = "Pup " + (g.i + 1) + " of " + ROUNDS;
    $("sstars").textContent = "⭐ " + g.stars;
    $("sbar").style.width = (g.i / ROUNDS * 100) + "%";
    $("sart").innerHTML = art(b); $("sart").className = "qart sart";
    var grp = b.group.toLowerCase();
    $("sclue").textContent = "A " + b.size + (grp === b.size ? "" : " " + grp) + " pup from " + b.origin + ".";
    $("sfb").textContent = ""; $("sfb").className = "qfb";
    $("snext").hidden = true; $("shint").disabled = false; $("sundo").disabled = true;
    var tiles = $("stiles"); tiles.innerHTML = "";
    g.mix.split("").forEach(function (ch, k) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "stile"; t.textContent = ch; t.dataset.k = k;
      t.setAttribute("aria-label", "Letter " + ch);
      t.onclick = function () { place(k); };
      tiles.appendChild(t);
    });
    paint();
    tiles.firstChild.focus({ preventScroll: true });
  }
  // answer slots, keeping the gaps between words (e.g. SHIBA INU)
  function paint() {
    var b = g.order[g.i], box = $("sslots"), li = 0; box.innerHTML = "";
    b.name.toUpperCase().split("").forEach(function (ch) {
      if (!/[A-Z]/.test(ch)) { var gap = document.createElement("span"); gap.className = "sgap"; box.appendChild(gap); return; }
      var s = document.createElement("span"), k = g.picked[li];
      s.className = "sslot" + (k != null ? " full" : "") + (li < g.hinted ? " hint" : "");
      s.textContent = k != null ? g.mix[k] : "";
      box.appendChild(s); li++;
    });
    var spelled = g.picked.map(function (k) { return g.mix[k]; }).join("");
    box.setAttribute("aria-label", "Your answer: " + (spelled ? spelled.split("").join(" ") : "empty") + ", " + g.picked.length + " of " + g.word.length + " letters");
    Array.prototype.forEach.call(document.querySelectorAll(".stile"), function (t) { t.disabled = g.solved || g.picked.indexOf(+t.dataset.k) >= 0; });
    $("sundo").disabled = g.solved || g.picked.length <= g.hinted;
  }
  function place(k) {
    if (!g || g.solved || g.locked || g.picked.indexOf(k) >= 0) return;
    g.picked.push(k);
    if (window.PuppySound) PuppySound.play("pop");
    paint();
    if (g.picked.length === g.word.length) check();
  }
  function undo() {
    if (!g || g.solved || g.locked || g.picked.length <= g.hinted) return;
    g.picked.pop(); paint();
  }
  function hint() {
    if (!g || g.solved || g.locked) return;
    // keep the letters that are right so far, then add the next right one
    var ok = 0; while (ok < g.picked.length && g.mix[g.picked[ok]] === g.word[ok]) ok++;
    g.picked = g.picked.slice(0, ok);
    var need = g.word[ok], k = -1;
    for (var i = 0; i < g.mix.length; i++) if (g.mix[i] === need && g.picked.indexOf(i) < 0) { k = i; break; }
    g.picked.push(k); g.hinted = g.picked.length; g.used = true; g.hintUsed = true;
    $("sfb").textContent = "💡 The next letter is " + need + "!"; $("sfb").className = "qfb";
    if (window.PuppySound) PuppySound.play("pop");
    paint();
    if (g.picked.length === g.word.length) check();
  }
  function check() {
    var b = g.order[g.i], spelled = g.picked.map(function (k) { return g.mix[k]; }).join("");
    if (spelled === g.word) {
      g.solved = true;
      var star = g.hinted === 0;
      if (star) g.stars++;
      $("sstars").textContent = "⭐ " + g.stars;
      $("sart").classList.add("yay");
      $("sfb").textContent = (star ? "⭐ Yay! " : "🎉 You got it! ") + "It's the " + b.name + "! " + (b.fact || "");
      $("sfb").className = "qfb good";
      if (window.PuppySound) { PuppySound.play("yay"); setTimeout(function () { PuppySound.play("bark", b); }, 350); }
      paint();
      $("snext").textContent = g.i + 1 < ROUNDS ? "Next pup →" : "See my stars ⭐";
      $("snext").hidden = false; $("snext").focus({ preventScroll: true });
    } else {
      g.locked = true;
      $("sart").classList.remove("oops"); void $("sart").offsetWidth; $("sart").classList.add("oops");
      $("sslots").classList.add("wrong");
      $("sfb").textContent = "Almost! " + spelled + " isn't quite it. Try again 🐾"; $("sfb").className = "qfb bad";
      if (window.PuppySound) PuppySound.play("oops");
      setTimeout(function () {
        $("sslots").classList.remove("wrong");
        g.picked = g.picked.slice(0, g.hinted); g.locked = false; paint();
        var t = document.querySelector(".stile:not(:disabled)"); if (t) t.focus({ preventScroll: true });
      }, 700);
    }
  }
  function next() {
    if (!g || !g.solved) return;
    if (g.i + 1 < ROUNDS) { g.i++; round(); } else done();
  }
  function done() {
    var prev = best(), n = g.stars;
    if (n > prev) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }
    $("sbar").style.width = "100%";
    $("splay").hidden = true; $("sdone").hidden = false;
    $("sfinal").textContent = "⭐ " + n + " of " + ROUNDS + " spelled without hints!";
    $("smsg").textContent = (n === ROUNDS ? "Perfect speller! Every pup is so proud of you 💖" : n >= 4 ? "Super spelling! The pups are wagging 🐶" : "Nice try! Every round makes you a better pup speller 🌸") + (n > prev ? " New best!" : "");
    if (window.PuppySound && n >= 3) PuppySound.play("fanfare");
    label();
    $("sagain").focus({ preventScroll: true });
  }
  $("scramblebtn").onclick = function () { start(); dlg.showModal(); };
  $("sagain").onclick = start;
  $("snext").onclick = next;
  $("shint").onclick = hint;
  $("sundo").onclick = undo;
  $("sclose").onclick = function () { dlg.close(); };
  $("sslots").onclick = undo;
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("scramblebtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!g || $("splay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") { e.preventDefault(); undo(); return; }
    if (e.key === "Enter" && g.solved) { e.preventDefault(); next(); return; }
    if (e.key === "?") { e.preventDefault(); hint(); return; }
    if (/^[a-z]$/i.test(e.key)) {
      var ch = e.key.toUpperCase();
      for (var i = 0; i < g.mix.length; i++) if (g.mix[i] === ch && g.picked.indexOf(i) < 0) { e.preventDefault(); place(i); return; }
    }
  });
  window.PuppyScramble = { pool: POOL.map(function (b) { return b.id; }), letters: letters, scramble: scramble, state: function () { return g; }, rounds: ROUNDS };
  label();
})();
