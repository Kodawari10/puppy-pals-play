/* 🌙 Goodnight: three pups are still awake. Tuck them in the right order, then pick a night light.
   One tuck-in a night. The moon grows as your nights add up. Saved in localStorage (puppyPals.nights). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.nights", MAX_DAYS = 90;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var LIGHTS = [
    { id: "moon", emoji: "🌙", name: "moonlight" },
    { id: "star", emoji: "⭐", name: "star light" },
    { id: "lantern", emoji: "🏮", name: "lantern glow" }
  ];
  var PHASES = [
    { id: "new", emoji: "🌑", name: "a new moon" },
    { id: "crescent", emoji: "🌒", name: "a crescent moon" },
    { id: "quarter", emoji: "🌓", name: "a quarter moon" },
    { id: "gibbous", emoji: "🌔", name: "a gibbous moon" },
    { id: "full", emoji: "🌕", name: "a full moon" }
  ];
  var forced = null, order = [], tucked = {}, light = "";

  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function asBreed(b) { return typeof b === "string" ? byId(b) : b; }
  function lightOf(id) { return LIGHTS.filter(function (l) { return l.id === id; })[0] || null; }
  function nick(b) { return window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : ""; }
  function who(b) {
    var n = nick(b), trait = (b.traits && b.traits[0] ? b.traits[0] : "sweet").toLowerCase();
    return n ? n + " the " + b.name : "the " + trait + " " + b.name;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function hash(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function parseDate(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || "");
    if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
    var d = new Date(y, mo - 1, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return d;
  }
  function fmtDate(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function shiftDate(key, days) {
    var d = parseDate(key);
    if (!d || typeof days !== "number" || !isFinite(days)) return "";
    d.setDate(d.getDate() + Math.trunc(days));
    return fmtDate(d);
  }
  function todayKey() { return forced && parseDate(forced) ? forced : fmtDate(new Date()); }
  function prettyDate(key) { var d = parseDate(key); return d ? MONTHS[d.getMonth()] + " " + d.getDate() : ""; }
  function phase(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    if (n <= 0) return PHASES[0];
    if (n === 1) return PHASES[1];
    if (n === 2) return PHASES[2];
    if (n === 3) return PHASES[3];
    return PHASES[4];
  }
  function plan(date) {
    if (!parseDate(date) || !B.length) return [];
    var ids = [], h = hash("night" + date), i = 0;
    while (ids.length < 3 && i < B.length + 5) {
      var id = B[(h + i * 17) % B.length].id;
      if (ids.indexOf(id) < 0) ids.push(id);
      i++;
    }
    return ids;
  }
  function goodPups(ids) {
    if (!ids || ids.length !== 3) return false;
    var seen = {}, i;
    for (i = 0; i < 3; i++) {
      if (!byId(ids[i]) || seen[ids[i]]) return false;
      seen[ids[i]] = 1;
    }
    return true;
  }
  function yawn(breed) {
    var b = asBreed(breed);
    return b ? cap(who(b)) + " yawns, curls up, and drifts off. Zzz…" : "";
  }
  function waiting(breed) {
    var b = asBreed(breed);
    return b ? "Not yet. " + cap(who(b)) + " is still waiting for a tuck." : "";
  }
  function ending(pups, lightId) {
    var lightRow = lightOf(lightId);
    if (!pups || pups.length !== 3 || !lightRow) return "";
    var names = [], seen = {}, i;
    for (i = 0; i < 3; i++) {
      var b = asBreed(pups[i]);
      if (!b || seen[b.id]) return "";
      seen[b.id] = 1;
      names.push(b.name);
    }
    return "All tucked in under the " + lightRow.name + ". Sweet dreams, " + names[0] + ", " + names[1] + " and " + names[2] + "!";
  }
  function trim(days) {
    var keys = Object.keys(days).sort();
    while (keys.length > MAX_DAYS) delete days[keys.shift()];
  }
  function load() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    var days = {};
    if (raw && raw.days && typeof raw.days === "object" && !Array.isArray(raw.days)) {
      Object.keys(raw.days).forEach(function (k) {
        var v = raw.days[k];
        if (!parseDate(k) || !v || typeof v !== "object" || !goodPups(v.pups) || !lightOf(v.light)) return;
        days[k] = { pups: v.pups.slice(), light: v.light };
      });
    }
    trim(days);
    return { days: days };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function count() { return Object.keys(st.days).length; }
  function label() {
    var n = count(), el = $("nightbest");
    if (el) el.textContent = n ? n + " night" + (n === 1 ? "" : "s") : "";
  }
  function record(date, pups, lightId) {
    if (!parseDate(date) || !goodPups(pups) || !lightOf(lightId)) return false;
    st.days[date] = { pups: pups.slice(), light: lightId };
    trim(st.days); save(); label();
    return true;
  }
  function nextAwake() {
    var i;
    for (i = 0; i < order.length; i++) if (!tucked[order[i]]) return order[i];
    return "";
  }

  var st = load(), dlg = $("night");

  function art(b, tag) {
    var d = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b;
    return DogArt.svg(d, { id: "gn-" + tag + "-" + b.id, title: false });
  }
  function say(msg) { $("nlive").textContent = msg; }
  function setNote(msg) { $("nnote").textContent = msg; say(msg); }
  function paint() {
    var key = todayKey(), ph = phase(count());
    $("nsky").textContent = ph.emoji + " " + prettyDate(key) + " · " + ph.name;
    $("nroom").setAttribute("data-light", light || "moon");
    $("nbeds").innerHTML = order.map(function (id, i) {
      var b = byId(id), asleep = !!tucked[id];
      return '<button type="button" class="nbed' + (asleep ? " asleep" : "") + '" data-id="' + id + '" data-i="' + i + '" aria-pressed="' + (asleep ? "true" : "false") + '">' +
        '<span class="nk" aria-hidden="true">' + (i + 1) + "</span>" +
        '<span class="nart" aria-hidden="true">' + art(b, "b" + i) + "</span>" +
        '<span class="nname">' + b.name + "</span>" +
        (asleep ? '<span class="nzzz" aria-hidden="true">💤</span>' : "") +
        "</button>";
    }).join("");
    var ready = !nextAwake();
    $("nlights").hidden = !ready;
    $("nlights").querySelectorAll(".nlight").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.id === light));
    });
  }
  function focusNext() {
    var need = nextAwake();
    var btn = need ? $("nbeds").querySelector('.nbed[data-id="' + need + '"]') : $("nlights").querySelector(".nlight");
    if (btn) btn.focus({ preventScroll: true });
  }
  function shake(id) {
    var btn = $("nbeds").querySelector('.nbed[data-id="' + id + '"]');
    if (!btn) return;
    btn.classList.remove("nshake"); void btn.offsetWidth; btn.classList.add("nshake");
  }
  function begin() {
    var key = todayKey(), saved = st.days[key];
    tucked = {};
    if (saved) {
      order = saved.pups.slice();
      light = saved.light;
      order.forEach(function (id) { tucked[id] = true; });
      paint();
      setNote("You already tucked everyone in tonight. " + ending(order.map(byId), light));
    } else {
      order = plan(key);
      light = "";
      paint();
      setNote(order.length ? "Tuck in " + byId(order[0]).name + " next." : "");
    }
  }
  function tuck(id) {
    if (!id || !byId(id) || tucked[id]) return;
    var need = nextAwake();
    if (!need) return;
    if (id !== need) {
      setNote(waiting(byId(need)));
      shake(id);
      if (window.PuppySound) PuppySound.play("oops");
      return;
    }
    tucked[id] = true;
    var line = yawn(byId(id)), nxt = nextAwake();
    line += nxt ? " Next: " + byId(nxt).name + "." : " Pick a night light.";
    paint();
    setNote(line);
    if (window.PuppySound) PuppySound.play("snore", byId(id));
    focusNext();
  }
  function chooseLight(id) {
    if (nextAwake() || !lightOf(id)) return;
    var key = todayKey(), was = !!st.days[key];
    light = id;
    st.days[key] = { pups: order.slice(), light: id };
    trim(st.days); save(); label();
    paint();
    var end = ending(order.map(byId), id);
    setNote(was ? "The room glows with " + lightOf(id).name + ". " + end : end);
    if (window.PuppySound) PuppySound.play(was ? "pop" : "fanfare");
    if (window.PuppyPals && PuppyPals.toast) PuppyPals.toast((was ? "✨ Night light: " : "🌙 Sweet dreams under the ") + lightOf(id).name);
  }

  $("nbeds").addEventListener("click", function (e) {
    var t = e.target.closest(".nbed"); if (!t) return;
    tuck(t.dataset.id);
  });
  $("nlights").addEventListener("click", function (e) {
    var t = e.target.closest(".nlight"); if (!t) return;
    chooseLight(t.dataset.id);
  });
  $("nightbtn").onclick = function () {
    st = load(); begin(); dlg.showModal(); focusNext();
  };
  $("nclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("nightbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== "1" && e.key !== "2" && e.key !== "3") return;
    e.preventDefault();
    var i = Number(e.key) - 1;
    if (nextAwake()) tuck(order[i]);
    else chooseLight(LIGHTS[i].id);
  });
  label();
  window.PuppyNight = {
    lights: function () { return LIGHTS.map(function (l) { return l.id; }); },
    phases: function () { return PHASES.map(function (p) { return p.id; }); },
    plan: plan, phase: function (n) { var p = phase(n); return { id: p.id, emoji: p.emoji, name: p.name }; },
    yawn: yawn, waiting: waiting, ending: ending,
    shiftDate: shiftDate, today: todayKey, setToday: function (k) { forced = parseDate(k) ? k : null; },
    get: function () { return JSON.parse(JSON.stringify(st)); }, count: count, record: record, maxDays: MAX_DAYS
  };
})();
