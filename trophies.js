/* "Trophy shelf": cute badges earned from everything you do in Puppy Pals (meeting pups, pets, outfits, games).
   Badges are worked out from what the other features already save in localStorage, so nothing is double-counted.
   Newly earned badges get a toast; the ones already celebrated are kept in localStorage (puppyPals.trophies). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var SEEN_KEY = "puppyPals.trophies";
  function raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function num(k) { var n = parseInt(raw(k), 10); return isNaN(n) || n < 0 ? 0 : n; }
  function obj(k) { var o; try { o = JSON.parse(raw(k) || "{}"); } catch (e) { o = {}; } return o && typeof o === "object" && !Array.isArray(o) ? o : {}; }
  function arr(k) { var a; try { a = JSON.parse(raw(k) || "[]"); } catch (e) { a = []; } return Array.isArray(a) ? a : []; }
  function known(id) { return B.some(function (b) { return b.id === id; }); }
  function uniqKnown(list) { return list.filter(function (id, i) { return list.indexOf(id) === i && known(id); }); }
  function countKeys(o, ok) { return Object.keys(o).filter(function (id) { return known(id) && ok(o[id]); }).length; }
  var met = function () { return uniqKnown(arr("puppyPals.met")).length; };
  // each badge: have() returns current progress, goal is the target; btn is what to open to work on it
  var BADGES = [
    { id: "hello", icon: "🐾", name: "First hello", how: "Meet your first pup", goal: 1, have: met, btn: "meetbtn" },
    { id: "social", icon: "🎈", name: "Social butterfly", how: "Meet 20 pups", goal: 20, have: met, btn: "meetbtn" },
    { id: "passport", icon: "👑", name: "Full passport", how: "Meet every pup", goal: B.length, have: met, btn: "meetbtn" },
    { id: "hearts", icon: "💖", name: "Big heart", how: "Favorite 5 pups", goal: 5, have: function () { return uniqKnown(arr("puppyPals.favs")).length; }, btn: "meetbtn" },
    { id: "bestie", icon: "🥰", name: "Best friends", how: "Give one pup 10 pets", goal: 10, btn: "meetbtn",
      have: function () { var o = obj("puppyPals.pets"), m = 0; Object.keys(o).forEach(function (id) { var n = +o[id]; if (known(id) && n > m) m = n; }); return m; } },
    { id: "stylist", icon: "🎀", name: "Pup stylist", how: "Dress up 3 pups", goal: 3, btn: "meetbtn",
      have: function () { return countKeys(obj("puppyPals.outfits"), function (v) { return v && typeof v === "object" && (v.collar || v.bow); }); } },
    { id: "namer", icon: "✏️", name: "Name giver", how: "Give a pup a nickname", goal: 1, btn: "meetbtn",
      have: function () { return countKeys(obj("puppyPals.names"), function (v) { return typeof v === "string" && v.trim(); }); } },
    { id: "match", icon: "🔮", name: "Kindred spirit", how: "Find your pup match", goal: 1, btn: "matchbtn", have: function () { return known(raw("puppyPals.match")) ? 1 : 0; } },
    { id: "quiz", icon: "🎓", name: "Pup expert", how: "Score 8 in Guess the Pup", goal: 8, btn: "quizbtn",
      have: function () { return Math.min(10, Math.max(num("puppyPals.quizBest"), num("puppyPals.quizBestShadow"))); } },
    { id: "shadow", icon: "🌑", name: "Shadow sleuth", how: "Score 5 in Shadow mode", goal: 5, btn: "quizbtn", have: function () { return Math.min(10, num("puppyPals.quizBestShadow")); } },
    { id: "pairs", icon: "🧩", name: "Sharp memory", how: "Win Pup Pairs in 12 moves or fewer", goal: 1, btn: "pairsbtn",
      have: function () { var n = num("puppyPals.pairsBest"); return n > 0 && n <= 12 ? 1 : 0; } },
    { id: "catch", icon: "🦴", name: "Treat champ", how: "Score 20 in Treat Catch", goal: 20, btn: "catchbtn", have: function () { return Math.min(999, num("puppyPals.catchBest")); } },
    { id: "bark", icon: "🎵", name: "Pup choir", how: "Reach round 5 in Bark Along", goal: 5, btn: "barkbtn", have: function () { return Math.min(999, num("puppyPals.barkBest")); } }
  ];
  function status() {
    return BADGES.map(function (t) { var h = Math.min(t.goal, Math.max(0, +t.have() || 0)); return { t: t, have: h, done: h >= t.goal }; });
  }
  function unlocked() { return status().filter(function (s) { return s.done; }).map(function (s) { return s.t.id; }); }
  function seen() { var r = raw(SEEN_KEY); return r === null ? null : uniqIds(arr(SEEN_KEY)); }
  function uniqIds(a) { return a.filter(function (id, i) { return a.indexOf(id) === i && BADGES.some(function (t) { return t.id === id; }); }); }
  function setSeen(a) { try { localStorage.setItem(SEEN_KEY, JSON.stringify(a)); } catch (e) {} }
  function sfx(n) { if (window.PuppySound) PuppySound.play(n); }
  function label() {
    var n = unlocked().length, el = $("trophyn");
    el.textContent = n + "/" + BADGES.length;
    $("trophybtn").setAttribute("aria-label", "Trophy shelf, " + n + " of " + BADGES.length + " earned");
  }
  // wait politely for any other toast to finish so the trophy message isn't swallowed
  var queue = [], showing = false;
  function pump() {
    if (showing || !queue.length) return;
    var t = $("toast");
    if (t && !t.hidden) { setTimeout(pump, 400); return; }
    showing = true;
    var msg = queue.shift();
    if (window.PuppyPals) PuppyPals.toast(msg);
    sfx("fanfare");
    setTimeout(function () { showing = false; pump(); }, 3700);
  }
  function check() {
    var now = unlocked(), was = seen();
    if (was === null) { setSeen(now); label(); return []; } // first visit: no flood of toasts for old progress
    var fresh = now.filter(function (id) { return was.indexOf(id) < 0; });
    if (fresh.length) {
      setSeen(uniqIds(was.concat(fresh)));
      fresh.forEach(function (id) {
        var t = BADGES.filter(function (x) { return x.id === id; })[0];
        queue.push("🏆 Trophy unlocked: " + t.icon + " " + t.name + "!");
      });
      pump();
    }
    label();
    if (dlg.open) render();
    return fresh;
  }
  var dlg = $("trophies");
  function render() {
    var st = status(), n = st.filter(function (s) { return s.done; }).length, grid = $("tgrid");
    $("tcount").textContent = n === BADGES.length ? "👑 Every trophy earned! You're the best pup pal." : n + " of " + BADGES.length + " trophies earned";
    $("tfill").style.width = (n / BADGES.length * 100) + "%";
    $("tbar").setAttribute("aria-valuenow", n);
    grid.innerHTML = "";
    st.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "trophy" + (s.done ? " got" : ""); b.dataset.id = s.t.id;
      var prog = s.t.goal > 1 && !s.done ? s.have + " / " + s.t.goal : "";
      b.setAttribute("aria-label", s.t.name + ": " + s.t.how + ". " + (s.done ? "Earned!" : prog ? "Progress " + prog + "." : "Not earned yet."));
      b.innerHTML = '<span class="ticon" aria-hidden="true">' + (s.done ? s.t.icon : "🔒") + '</span><span class="tname">' + s.t.name + '</span><span class="thow">' + s.t.how + "</span>" +
        (s.done ? '<span class="tok" aria-hidden="true">Earned ✨</span>' :
          prog ? '<span class="tprog" aria-hidden="true"><span style="width:' + (s.have / s.t.goal * 100) + '%"></span></span><span class="tnum" aria-hidden="true">' + prog + "</span>" : "");
      b.addEventListener("click", function () { go(s.t); });
      grid.appendChild(b);
    });
  }
  // tapping a badge takes you to the thing that earns it
  function go(t) {
    dlg.close();
    var target = $(t.btn);
    if (target) setTimeout(function () { target.click(); }, 60);
  }
  function open() { check(); render(); dlg.showModal(); sfx("pop"); }
  $("trophybtn").onclick = open;
  $("tclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (!document.querySelector("dialog[open]")) $("trophybtn").focus({ preventScroll: true }); });
  // look for new trophies shortly after anything you do (cheap: it only reads localStorage)
  var pending = 0;
  function soon() { clearTimeout(pending); pending = setTimeout(check, 500); }
  document.addEventListener("click", soon, true);
  document.addEventListener("keyup", soon, true);
  document.addEventListener("close", soon, true);
  window.addEventListener("storage", soon);
  check();
  window.PuppyTrophies = { BADGES: BADGES, status: function () { return status().map(function (s) { return { id: s.t.id, have: s.have, goal: s.t.goal, done: s.done }; }); }, unlocked: unlocked, check: check, open: open };
})();
