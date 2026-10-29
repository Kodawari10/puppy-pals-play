/* 🖼️ Pup Puzzle: a pup picture is cut into tiles and mixed up. Tap two tiles to swap them until the pup is whole again.
   Easy is 3×3, Tricky is 4×4. 👀 Peek shows the whole picture for a moment. Fewest moves per size is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var BEST_KEY = "puppyPals.puzzleBest", SIZE_KEY = "puppyPals.puzzleSize";
  var dlg = $("puzzle"), g = null, peekT = null;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function size() { var n; try { n = parseInt(localStorage.getItem(SIZE_KEY), 10); } catch (e) {} return n === 4 ? 4 : 3; }
  function bests() {
    var o; try { o = JSON.parse(localStorage.getItem(BEST_KEY) || "{}"); } catch (e) { o = {}; }
    var out = {}; if (o && typeof o === "object") ["3", "4"].forEach(function (k) { var v = o[k]; if (typeof v === "number" && v > 0 && v < 1000 && Math.floor(v) === v) out[k] = v; });
    return out;
  }
  function label() { var b = bests(), parts = []; if (b["3"]) parts.push("Easy " + b["3"]); if (b["4"]) parts.push("Tricky " + b["4"]); $("puzzlebest").textContent = parts.length ? "Best: " + parts.join(" · ") + " moves" : ""; }
  // a mixed-up order where no tile already sits in its own spot, so every tile needs moving
  function scramble(n) {
    var ids = [], k; for (k = 0; k < n * n; k++) ids.push(k);
    var o; do { o = shuffle(ids); } while (o.some(function (v, i) { return v === i; }));
    return o;
  }
  // the fewest swaps that can fix this mix: tiles minus the number of swap-cycles
  function minSwaps(o) { var seen = [], cyc = 0; o.forEach(function (v, i) { if (seen[i]) return; cyc++; for (var j = i; !seen[j]; j = o[j]) seen[j] = true; }); return o.length - cyc; }
  function solved() { return g.order.every(function (v, i) { return v === i; }); }
  function pick(id) {
    if (id) return B.filter(function (b) { return b.id === id; })[0];
    // prefer pups you've met, so the picture is a friend
    var met = window.PuppyPals ? PuppyPals.met() : [], pool = B.filter(function (b) { return met.indexOf(b.id) >= 0; });
    if (pool.length < 5) pool = B;
    var others = g && g.pup ? pool.filter(function (b) { return b.id !== g.pup.id; }) : pool;
    return others[Math.floor(Math.random() * others.length)];
  }
  function tileArt(k) {
    var n = g.n, r = Math.floor(k / n), c = k % n;
    return '<span class="pzimg" aria-hidden="true" style="width:' + n * 100 + "%;height:" + n * 100 + "%;left:" + -c * 100 + "%;top:" + -r * 100 + '%">' + g.art.replace(/id="([^"]+)"/g, 'id="$1-t' + k + '"').replace(/url\(#([^)]+)\)/g, "url(#$1-t" + k + ")").replace(/href="#([^"]+)"/g, 'href="#$1-t' + k + '"') + "</span>";
  }
  function where(k) { var n = g.n; return "row " + (Math.floor(k / n) + 1) + ", column " + (k % n + 1); }
  function render(focusAt) {
    var n = g.n, box = $("pzgrid");
    box.style.setProperty("--n", n);
    box.classList.toggle("done", g.done);
    box.innerHTML = g.order.map(function (piece, at) {
      var ok = piece === at;
      return '<button type="button" class="pztile' + (ok ? " ok" : "") + (g.sel === at ? " sel" : "") + '" data-at="' + at + '" aria-pressed="' + (g.sel === at) + '" aria-label="Tile at ' + where(at) + (ok ? ", in the right place" : "") + '"' + (g.done ? " disabled" : "") + ">" + tileArt(piece) + "</button>";
    }).join("");
    var right = g.order.filter(function (v, i) { return v === i; }).length;
    $("pzmoves").textContent = "Moves: " + g.moves;
    $("pzright").textContent = "✅ " + right + " / " + n * n;
    $("pzsize3").setAttribute("aria-pressed", String(n === 3)); $("pzsize4").setAttribute("aria-pressed", String(n === 4));
    if (focusAt != null) { var t = box.querySelector('[data-at="' + focusAt + '"]'); if (t) t.focus({ preventScroll: true }); }
  }
  function start(n, id) {
    n = n || size(); try { localStorage.setItem(SIZE_KEY, String(n)); } catch (e) {}
    var pup = pick(id);
    g = { n: n, pup: pup, art: DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(pup) : pup, { id: "pz-" + pup.id, title: false }), order: scramble(n), sel: null, moves: 0, done: false };
    g.min = minSwaps(g.order);
    $("pzwho").textContent = "Mixed-up pup! Who could it be? 🤔";
    $("pzdone").hidden = true; $("pzpeek").disabled = false; $("pzpeek").hidden = false; $("pzlive").textContent = "";
    clearTimeout(peekT); $("pzgrid").classList.remove("peek");
    render(0);
  }
  function tap(at) {
    if (!g || g.done) return;
    if (g.sel === null) { g.sel = at; render(at); if (window.PuppySound) PuppySound.play("pop"); $("pzlive").textContent = "Picked the tile at " + where(at) + ". Now tap where it goes."; return; }
    if (g.sel === at) { g.sel = null; render(at); $("pzlive").textContent = "Let go of the tile."; return; }
    var a = g.sel, t = g.order[a]; g.order[a] = g.order[at]; g.order[at] = t; g.sel = null; g.moves++;
    var nowRight = (g.order[a] === a ? 1 : 0) + (g.order[at] === at ? 1 : 0);
    if (solved()) return win(at);
    render(at);
    if (window.PuppySound) PuppySound.play(nowRight ? "yay" : "pop");
    $("pzlive").textContent = "Swapped. " + (nowRight ? (nowRight === 2 ? "Two tiles" : "A tile") + " clicked into place! " : "") + g.order.filter(function (v, i) { return v === i; }).length + " of " + g.n * g.n + " tiles are right.";
  }
  function win(at) {
    g.done = true; render(null);
    var b = bests(), key = String(g.n), prev = b[key], isNew = !prev || g.moves < prev;
    if (isNew) { b[key] = g.moves; try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) {} }
    var nick = window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(g.pup.id) : "";
    $("pzwho").textContent = "🎉 It's " + (nick ? nick + " the " : "the ") + g.pup.name + "!";
    $("pzdonemsg").textContent = "You fixed the picture in " + g.moves + " moves" + (g.moves === g.min ? " — the fewest possible! 🏆" : isNew && prev ? ". New best! 🌟" : "!") + " " + g.pup.fact;
    $("pzmeet").textContent = "Meet the " + g.pup.name + " 🐾"; $("pzmeet").dataset.id = g.pup.id;
    $("pzdone").hidden = false; $("pzpeek").disabled = true; $("pzpeek").hidden = true;
    $("pzlive").textContent = "Puzzle solved! It's the " + g.pup.name + ". " + g.moves + " moves.";
    if (window.PuppySound) { PuppySound.play("fanfare"); setTimeout(function () { PuppySound.play("bark", g.pup); }, 500); }
    label(); $("pznew").focus({ preventScroll: true });
  }
  function peek() {
    if (!g || g.done) return;
    var grid = $("pzgrid"); grid.classList.add("peek"); $("pzpeekart").innerHTML = g.art.replace(/id="([^"]+)"/g, 'id="$1-pk"').replace(/url\(#([^)]+)\)/g, "url(#$1-pk)");
    $("pzlive").textContent = "Peeking at the whole picture.";
    clearTimeout(peekT); peekT = setTimeout(function () { grid.classList.remove("peek"); }, 1500);
  }
  $("pzgrid").addEventListener("click", function (e) { var t = e.target.closest(".pztile"); if (t) tap(+t.dataset.at); });
  $("pzgrid").addEventListener("keydown", function (e) {
    var t = e.target.closest(".pztile"); if (!t || !g) return;
    var at = +t.dataset.at, n = g.n, to = null;
    if (e.key === "ArrowRight" && at % n < n - 1) to = at + 1; else if (e.key === "ArrowLeft" && at % n > 0) to = at - 1;
    else if (e.key === "ArrowDown" && at + n < n * n) to = at + n; else if (e.key === "ArrowUp" && at - n >= 0) to = at - n;
    if (to != null) { e.preventDefault(); $("pzgrid").querySelector('[data-at="' + to + '"]').focus({ preventScroll: true }); }
  });
  $("pzpeek").onclick = peek;
  $("pzsize3").onclick = function () { start(3); }; $("pzsize4").onclick = function () { start(4); };
  $("pznew").onclick = function () { start(g ? g.n : size()); };
  $("pzmeet").onclick = function () { var id = $("pzmeet").dataset.id; dlg.dataset.meeting = "1"; dlg.close(); delete dlg.dataset.meeting; if (window.PuppyPals) PuppyPals.openBreed(id); };
  $("puzzlebtn").onclick = function () { start(size()); dlg.showModal(); $("pzgrid").querySelector(".pztile").focus({ preventScroll: true }); };
  $("pzclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { clearTimeout(peekT); if (!dlg.dataset.meeting) $("puzzlebtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "p" || e.key === "P") { e.preventDefault(); peek(); }
  });
  label();
  window.PuppyPuzzle = { start: start, tap: tap, state: function () { return g; }, scramble: scramble, minSwaps: minSwaps, bests: bests };
})();
