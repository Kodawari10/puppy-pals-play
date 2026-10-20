/* "Guess the Pup" quiz: 10 rounds, pick the breed name for the drawing. Best score is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 10, BEST_KEY = "puppyPals.quizBest";
  var dlg = $("quiz"), q = null;
  function best() { var n = parseInt(localStorage.getItem(BEST_KEY), 10); return isNaN(n) ? 0 : n; }
  function setBest(n) { try { localStorage.setItem(BEST_KEY, String(n)); } catch (e) {} }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Wrong answers prefer pups of the same size or group, so it's a bit tricky
  function choicesFor(ans) {
    var near = shuffle(B.filter(function (b) { return b !== ans && (b.size === ans.size || b.group === ans.group); }));
    var rest = shuffle(B.filter(function (b) { return b !== ans && near.indexOf(b) < 0; }));
    return shuffle([ans].concat(near.concat(rest).slice(0, 3)));
  }
  function updateBestLabel() { var b = best(); $("quizbest").textContent = b ? "Best: " + b + "/" + ROUNDS : ""; }
  function start() {
    q = { order: shuffle(B).slice(0, ROUNDS), i: 0, score: 0, locked: false };
    $("qplay").hidden = false; $("qdone").hidden = true;
    round();
  }
  function round() {
    var ans = q.order[q.i]; q.locked = false;
    $("qprog").textContent = "Pup " + (q.i + 1) + " of " + ROUNDS;
    $("qscore").textContent = "★ " + q.score;
    $("qbar").style.width = (q.i / ROUNDS * 100) + "%";
    $("qart").innerHTML = DogArt.svg(ans);
    $("qart").classList.remove("yay", "oops");
    $("qfb").textContent = ""; $("qfb").className = "qfb";
    $("qnext").hidden = true;
    var box = $("qopts"); box.innerHTML = "";
    choicesFor(ans).forEach(function (b, k) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "qopt"; btn.dataset.id = b.id;
      btn.innerHTML = '<span class="qk">' + (k + 1) + "</span>" + b.name;
      btn.onclick = function () { pick(b, btn); };
      box.appendChild(btn);
    });
    box.firstChild.focus({ preventScroll: true });
  }
  function pick(b, btn) {
    if (q.locked) return; q.locked = true;
    var ans = q.order[q.i], ok = b === ans;
    if (ok) q.score++;
    document.querySelectorAll(".qopt").forEach(function (o) {
      o.disabled = true;
      if (o.dataset.id === ans.id) o.classList.add("right");
    });
    if (!ok) btn.classList.add("wrong");
    $("qart").classList.add(ok ? "yay" : "oops");
    $("qscore").textContent = "★ " + q.score;
    $("qfb").className = "qfb " + (ok ? "good" : "bad");
    $("qfb").textContent = ok ? cheer() + " It's the " + ans.name + " from " + ans.origin + "." : "Aww, that's the " + ans.name + ". " + ans.traits[0] + " and " + ans.traits[1].toLowerCase() + "!";
    var last = q.i === ROUNDS - 1;
    $("qnext").textContent = last ? "See score ★" : "Next pup →";
    $("qnext").hidden = false; $("qnext").focus({ preventScroll: true });
  }
  function cheer() { return ["Yay!", "Pawsome!", "Woof, correct!", "You got it!", "So smart!"][Math.floor(Math.random() * 5)]; }
  function next() {
    if (q.i < ROUNDS - 1) { q.i++; round(); return; }
    $("qbar").style.width = "100%";
    var prev = best(), isNew = q.score > prev;
    if (isNew) setBest(q.score);
    $("qplay").hidden = true; $("qdone").hidden = false;
    $("qfinal").textContent = q.score + " / " + ROUNDS;
    $("qmsg").textContent = (q.score === ROUNDS ? "Perfect! You're a top dog! 🏆" : q.score >= 7 ? "Great job, puppy pro! 🐶" : q.score >= 4 ? "Nice try! The pups believe in you. 🐾" : "Keep browsing the gallery and try again! 💕") + (isNew && prev ? " New best score!" : "");
    updateBestLabel();
    $("qagain").focus();
  }
  $("quizbtn").onclick = function () { start(); dlg.showModal(); };
  $("qnext").onclick = next;
  $("qagain").onclick = start;
  $("qclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("quizbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!q || $("qplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !q.locked) { var o = document.querySelectorAll(".qopt")[n - 1]; if (o) { e.preventDefault(); o.click(); } }
  });
  updateBestLabel();
})();
