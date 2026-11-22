/* "Pup Pairs" memory game: flip cards to find 6 matching pups. Fewest moves is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var PAIRS = 6, BEST_KEY = "puppyPals.pairsBest", PEEK = 850;
  var dlg = $("pairs"), g = null, timer = 0;
  function best() { var n = parseInt(localStorage.getItem(BEST_KEY), 10); return isNaN(n) ? 0 : n; }
  function setBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {} }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sfx(n, b) { if (window.PuppySound) PuppySound.play(n, b); }
  function bestLabel() { var b = best(); $("pairsbest").textContent = b ? "Best: " + b + " moves" : ""; }
  function hud() {
    $("pmoves").textContent = "Moves: " + g.moves;
    $("pfound").textContent = "🐾 " + g.found + " / " + PAIRS;
    $("pbar").style.width = (g.found / PAIRS * 100) + "%";
  }
  function label(btn, i) {
    var b = g.cards[i], up = btn.classList.contains("up") || btn.classList.contains("got");
    btn.setAttribute("aria-label", up ? b.name + (btn.classList.contains("got") ? ", matched" : "") : "Card " + (i + 1) + ", face down");
  }
  function start() {
    clearTimeout(timer); timer = 0;
    var picks = shuffle(B).slice(0, PAIRS);
    g = { cards: shuffle(picks.concat(picks)), open: [], moves: 0, found: 0 };
    var box = $("pgrid"); box.innerHTML = "";
    g.cards.forEach(function (b, i) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "pcard"; btn.dataset.id = b.id; btn.dataset.i = i;
      btn.innerHTML = '<span class="pin"><span class="pback" aria-hidden="true">🐾</span><span class="pface" aria-hidden="true">' + DogArt.svg(b).replace(/<title>[\s\S]*?<\/title>/, "") + '<span class="pname">' + b.name + "</span></span></span>";
      btn.onclick = function () { flip(i); };
      label(btn, i);
      box.appendChild(btn);
    });
    $("pplay").hidden = false; $("pdone").hidden = true;
    $("pfb").textContent = "Find the matching pups!";
    hud();
    box.firstChild.focus({ preventScroll: true });
  }
  function btnAt(i) { return $("pgrid").children[i]; }
  function hideOpen() {
    clearTimeout(timer); timer = 0;
    g.open.forEach(function (j) { var b = btnAt(j); b.classList.remove("up", "miss"); label(b, j); });
    g.open = [];
  }
  function flip(i) {
    if (!g) return;
    var btn = btnAt(i);
    if (btn.classList.contains("got") || g.open.indexOf(i) >= 0) return;
    if (g.open.length === 2) hideOpen(); // tapping on during the peek flips the mismatch back right away
    btn.classList.add("up"); label(btn, i); g.open.push(i);
    if (g.open.length === 1) { sfx("pop"); return; }
    g.moves++;
    var a = g.cards[g.open[0]], b = g.cards[i];
    if (a.id === b.id) {
      g.open.forEach(function (j) { var c = btnAt(j); c.classList.remove("up"); c.classList.add("got"); label(c, j); });
      g.open = []; g.found++;
      sfx("bark", b);
      $("pfb").textContent = "A pair of " + b.name + "s! " + ["Pawsome!", "Woof!", "So cute!", "Yay!"][g.found % 4];
      hud();
      if (g.found === PAIRS) setTimeout(win, 650);
    } else {
      g.open.forEach(function (j) { btnAt(j).classList.add("miss"); });
      sfx("oops");
      $("pfb").textContent = "Not a pair: " + a.name + " and " + b.name + ".";
      hud();
      timer = setTimeout(hideOpen, PEEK);
    }
  }
  function win() {
    if (!g || g.found !== PAIRS || !dlg.open) return;
    var prev = best(), isNew = !prev || g.moves < prev;
    if (isNew) setBest(g.moves);
    $("pplay").hidden = true; $("pdone").hidden = false;
    $("pfinal").textContent = g.moves + " moves";
    $("pmsg").textContent = isNew ? (prev ? "New best! You beat " + prev + " moves 🎉" : "All pairs found! That's your first best score 🎉") :
      (g.moves <= PAIRS + 2 ? "Wow, what a memory!" : "All pairs found! Your best is " + prev + " moves.");
    sfx("fanfare");
    bestLabel();
    $("pagain").focus({ preventScroll: true });
  }
  // Arrow keys move around the 4-wide grid (3-wide on small phones)
  $("pgrid").addEventListener("keydown", function (e) {
    var k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: "up", ArrowDown: "down" }[e.key];
    if (!k || !e.target.classList.contains("pcard")) return;
    var cols = getComputedStyle($("pgrid")).gridTemplateColumns.split(" ").length || 4;
    var i = +e.target.dataset.i, n = g.cards.length;
    var j = k === "up" ? i - cols : k === "down" ? i + cols : i + k;
    if (j >= 0 && j < n) { e.preventDefault(); btnAt(j).focus(); }
  });
  $("pairsbtn").onclick = function () { start(); dlg.showModal(); };
  $("pclose").onclick = function () { dlg.close(); };
  $("pagain").onclick = start;
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { clearTimeout(timer); timer = 0; g = null; $("pairsbtn").focus({ preventScroll: true }); });
  bestLabel();
  window.PuppyPairs = { start: start, best: best, PAIRS: PAIRS };
})();
