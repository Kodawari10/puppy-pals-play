// 🔥 Visit streak: come back each day to grow a streak of paw prints (saved in localStorage)
(function () {
  "use strict";
  var KEY = "puppyPals.streak", MILESTONES = { 3: "🔥 3 days in a row! The pups missed you", 7: "🌟 A whole week of pup visits! You're a loyal pal", 14: "💖 Two weeks straight! The pups adore you", 30: "👑 30-day streak! Puppy Pal legend" };
  var $ = function (id) { return document.getElementById(id); };
  function key(d) { return window.PuppyPals.dayKey(d); }
  function addDays(k, n) { var p = k.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2] + n); return key(d); }
  function load() {
    var s; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    if (!s || typeof s !== "object" || !/^\d{4}-\d\d-\d\d$/.test(s.last) || !(s.n >= 1)) return null;
    var n = Math.min(9999, Math.floor(s.n)), best = Math.max(n, Math.floor(+s.best) || 0);
    return { last: s.last, n: n, best: Math.min(9999, best) };
  }
  // visit(today) -> {n, best, last, fresh, milestone}
  function visit(today) {
    today = today || key();
    var s = load(), fresh = true;
    if (s && s.last === today) fresh = false;
    else if (s && addDays(s.last, 1) === today) s.n += 1;
    else s = { n: 1, best: s ? s.best : 1, last: today };
    s.last = today; s.best = Math.max(s.best, s.n);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    s.fresh = fresh; s.milestone = fresh && MILESTONES[s.n] ? MILESTONES[s.n] : "";
    return s;
  }
  function paint(s) {
    var el = $("streak"); if (!el) return;
    $("streakn").textContent = s.n; $("streakd").textContent = s.n === 1 ? "day" : "days";
    $("streakbest").textContent = s.best > s.n ? "best " + s.best : "";
    var week = s.n % 7 === 0 ? 7 : s.n % 7, paws = "";
    for (var i = 1; i <= 7; i++) paws += '<span class="spaw' + (i <= week ? " on" : "") + '">🐾</span>';
    $("streakpaws").innerHTML = paws;
    el.setAttribute("aria-label", "Visit streak: " + s.n + (s.n === 1 ? " day" : " days") + " in a row" + (s.best > s.n ? ", best " + s.best : ""));
    el.classList.toggle("hot", s.n >= 3);
  }
  function run(today) {
    var s = visit(today); paint(s);
    if (s.milestone) {
      var el = $("streak"); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      setTimeout(function () { window.PuppyPals.toast(s.milestone); if (window.PuppySound) PuppySound.play(s.n >= 7 ? "fanfare" : "yay"); }, 900);
    }
    return s;
  }
  window.PuppyStreak = { visit: visit, load: load, run: run, addDays: addDays, milestones: Object.keys(MILESTONES).map(Number) };
  run();
})();
