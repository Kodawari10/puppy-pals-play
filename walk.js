/* 🦮 Walkies: take a pup on a little stroll. At three stops you pick what you do together,
   then you bring a souvenir home. One souvenir a day (stroll again to change it).
   Saved in localStorage (puppyPals.walks). Old or junk days are dropped. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.walks", MAX_DAYS = 90;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEATHERS = [
    { id: "sunny", emoji: "☀️", name: "sunny" },
    { id: "cloudy", emoji: "☁️", name: "cloudy" },
    { id: "rainy", emoji: "🌧️", name: "rainy" },
    { id: "snowy", emoji: "❄️", name: "snowy" },
    { id: "breezy", emoji: "🌬️", name: "breezy" },
    { id: "rainbow", emoji: "🌈", name: "rainbow" }
  ];
  var STOPS = [
    { id: "gate", title: "The garden gate", emoji: "🚪", setup: "A neighbor peeks over the gate and waves.",
      choices: [
        { id: "wave", emoji: "👋", name: "Wave back", reply: "waves a paw right back. The neighbor giggles." },
        { id: "bow", emoji: "🎀", name: "Polite bow", reply: "gives a tiny polite bow. How fancy!" },
        { id: "zoom", emoji: "💨", name: "Happy zoomies", reply: "does a little zoomie circle and comes back grinning." }
      ] },
    { id: "pond", title: "The duck pond", emoji: "🦆", setup: "Ducks paddle in a loop, quacking hello.",
      choices: [
        { id: "watch", emoji: "👀", name: "Watch quietly", reply: "sits still and watches every ripple." },
        { id: "sniff", emoji: "👃", name: "Sniff the breeze", reply: "sniffs the breeze and wags at the ducks." },
        { id: "pebble", emoji: "🪨", name: "Skip a pebble", reply: "watches a pebble skip across the water. Plop!" }
      ] },
    { id: "hill", title: "The grassy hill", emoji: "🌿", setup: "The hill is wide and the grass smells sweet.",
      choices: [
        { id: "flop", emoji: "💤", name: "Flop in the grass", reply: "flops in the sweet grass, then pops back up, ready to go." },
        { id: "pose", emoji: "📸", name: "Strike a pose", reply: "strikes a proud pose, ears up, ready for a photo." },
        { id: "roll", emoji: "🌀", name: "Roll down", reply: "rolls down the hill in a happy tumble and races back." }
      ] }
  ];
  var SOUVENIRS = [
    { id: "blossom", emoji: "🌸", name: "blossom", blurb: "A gentle walk" },
    { id: "ribbon", emoji: "🎀", name: "ribbon", blurb: "A fancy outing" },
    { id: "pebble", emoji: "⭐", name: "star pebble", blurb: "A zoomy walk" },
    { id: "shell", emoji: "🐚", name: "shell", blurb: "A curious stroll" },
    { id: "moon", emoji: "🌙", name: "moon pebble", blurb: "A dreamy walk" },
    { id: "clover", emoji: "🍀", name: "clover", blurb: "A happy wander" }
  ];
  var GENTLE = { wave: 1, bow: 1, watch: 1, flop: 1, pose: 1 };
  var ZOOMY = { zoom: 1, pebble: 1, roll: 1 };
  var forced = null;

  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function asBreed(b) { return typeof b === "string" ? byId(b) : b; }
  function weatherOf(id) { return WEATHERS.filter(function (w) { return w.id === id; })[0] || null; }
  function souvenirOf(id) { return SOUVENIRS.filter(function (s) { return s.id === id; })[0] || null; }
  function stopById(id) { return STOPS.filter(function (s) { return s.id === id; })[0] || null; }
  function nick(b) { return window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : ""; }
  function nameOf(b) { var n = nick(b); return n ? n + " the " + b.name : "the " + b.name; }
  function traitWho(b) {
    var n = nick(b), trait = (b.traits && b.traits[0] ? b.traits[0] : "sweet").toLowerCase();
    return n ? n + " the " + b.name : "the " + trait + " " + b.name;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
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
  function weatherFor(date) {
    if (!parseDate(date)) return WEATHERS[0].id;
    return WEATHERS[hash("sky" + date) % WEATHERS.length].id;
  }
  function pupFor(date) {
    if (!parseDate(date) || !B.length) return B[0] ? B[0].id : "";
    return B[hash("pup" + date) % B.length].id;
  }
  function souvenir(ids) {
    if (!ids || ids.length !== 3) return "";
    var z = 0, g = 0, sniff = false, i;
    for (i = 0; i < 3; i++) {
      if (!STOPS[i].choices.some(function (c) { return c.id === ids[i]; })) return "";
      if (ZOOMY[ids[i]]) z++;
      else if (GENTLE[ids[i]]) g++;
      if (ids[i] === "sniff") sniff = true;
    }
    if (z >= 2) return "pebble";
    if (ids[0] === "bow" && ids[2] === "pose") return "ribbon";
    if (g === 3) return "blossom";
    if (sniff && z >= 1) return "shell";
    if (sniff) return "moon";
    return "clover";
  }
  function moment(breed, stopId, choiceId, weatherId) {
    var b = asBreed(breed), stop = stopById(stopId), w = weatherOf(weatherId);
    if (!b || !stop || !w) return "";
    var c = stop.choices.filter(function (x) { return x.id === choiceId; })[0];
    if (!c) return "";
    return "On a " + w.name + " walk, " + traitWho(b) + " " + c.reply;
  }
  function setupLine(stopId, weatherId) {
    var stop = stopById(stopId), w = weatherOf(weatherId);
    if (!stop || !w) return "";
    return w.emoji + " " + stop.emoji + " " + stop.title + ". " + stop.setup + " It's " + w.name + ".";
  }
  function ending(breed, weatherId, souvenirId) {
    var b = asBreed(breed), w = weatherOf(weatherId), s = souvenirOf(souvenirId);
    if (!b || !w || !s) return "";
    return nameOf(b) + " trots home under a " + w.name + " sky and tucks a " + s.name + " into your paw. " + s.blurb + "!";
  }
  function trim(days) {
    var keys = Object.keys(days).sort();
    while (keys.length > MAX_DAYS) delete days[keys.shift()];
  }
  function load() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    var days = {}, last = "";
    if (raw && raw.days && typeof raw.days === "object" && !Array.isArray(raw.days)) {
      Object.keys(raw.days).forEach(function (k) {
        var v = raw.days[k];
        if (!parseDate(k) || !v || typeof v !== "object" || !byId(v.pup)) return;
        var ch = Array.isArray(v.choices) ? v.choices.slice(0, 3) : null;
        var sid = souvenir(ch);
        if (!sid) return;
        days[k] = { pup: v.pup, weather: weatherFor(k), choices: ch.slice(), souvenir: sid };
      });
    }
    trim(days);
    if (raw && byId(raw.last)) last = raw.last;
    if (!last) last = pupFor(todayKey());
    return { days: days, last: last };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function count() { return Object.keys(st.days).length; }
  function label() {
    var n = count(), el = $("walkbest");
    if (el) el.textContent = n ? n + " walk" + (n === 1 ? "" : "s") : "";
  }
  function record(date, pup, choiceIds) {
    var sid = souvenir(choiceIds);
    if (!parseDate(date) || !byId(pup) || !sid) return false;
    st.days[date] = { pup: pup, weather: weatherFor(date), choices: choiceIds.slice(), souvenir: sid };
    trim(st.days);
    save(); label();
    return true;
  }
  function weekOf(key) {
    var out = [], i;
    for (i = 6; i >= 0; i--) {
      var k = shiftDate(key, -i), day = st.days[k];
      out.push({ date: k, souvenir: day ? day.souvenir : "", pup: day ? day.pup : "" });
    }
    return out;
  }

  var st = load(), dlg = $("walk"), phase = "ready", step = 0, picked = null, choices = [];
  var pupId = st.days[todayKey()] ? st.days[todayKey()].pup : st.last;

  function art(b, tag) {
    var d = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b;
    return DogArt.svg(d, { id: "wk-" + tag + "-" + b.id, title: false });
  }
  function say(msg) { $("wlive").textContent = msg; }
  function paintWeek(el) {
    var key = todayKey();
    el.innerHTML = weekOf(key).map(function (d) {
      var dt = parseDate(d.date), wd = dt ? WDAYS[dt.getDay()] : "";
      var s = d.souvenir ? souvenirOf(d.souvenir) : null;
      var mark = s ? s.emoji : "·";
      var labelText = wd + (s ? ", " + s.name : ", no walk yet");
      return '<span class="wday' + (d.date === key ? " today" : "") + (s ? " got" : "") + '" role="listitem" aria-label="' + labelText + '"><i>' + (dt ? dt.getDate() : "") + '</i><b>' + mark + "</b></span>";
    }).join("");
  }
  function paintReady() {
    var key = todayKey(), w = weatherOf(weatherFor(key)), b = byId(pupId), day = st.days[key];
    var y = st.days[shiftDate(key, -1)];
    $("wsky").textContent = w.emoji + " " + cap(w.name) + " walk · " + prettyDate(key);
    $("wart").innerHTML = art(b, "r");
    $("wpup").textContent = b.name;
    if (day) {
      var s = souvenirOf(day.souvenir), pal = byId(day.pup);
      $("wnote").textContent = "You already strolled today with " + (pal ? pal.name : "a pal") + " and found a " + s.name + " " + s.emoji + ". Stroll again to change it.";
      $("wgo").textContent = "Stroll again 🦮";
    } else if (y && souvenirOf(y.souvenir)) {
      $("wnote").textContent = "Welcome back! Yesterday's " + souvenirOf(y.souvenir).name + " is still on the shelf. " + nameOf(b) + " is ready for a new walk.";
      $("wgo").textContent = "Let's stroll 🦮";
    } else {
      $("wnote").textContent = "Take " + nameOf(b) + " out for a little walk and bring a souvenir home.";
      $("wgo").textContent = "Let's stroll 🦮";
    }
    paintWeek($("wweek"));
  }
  function paintChoices() {
    var stop = STOPS[step];
    $("wchoices").innerHTML = stop.choices.map(function (c, i) {
      return '<button type="button" class="wchoice" data-id="' + c.id + '" aria-pressed="false">' +
        '<span class="wk" aria-hidden="true">' + (i + 1) + "</span>" +
        '<span class="we" aria-hidden="true">' + c.emoji + "</span> " + c.name + "</button>";
    }).join("");
  }
  function paintStop() {
    var stop = STOPS[step], w = weatherOf(weatherFor(todayKey())), b = byId(pupId);
    $("wstep").textContent = "Stop " + (step + 1) + " of " + STOPS.length + " · " + w.emoji + " " + w.name;
    $("wart2").innerHTML = art(b, "s" + step);
    $("wscene").setAttribute("data-sky", w.id);
    $("wsetup").textContent = setupLine(stop.id, w.id);
    $("wreply").textContent = "";
    $("won").hidden = true;
    paintChoices();
  }
  function show(v) {
    phase = v;
    $("wready").hidden = v !== "ready";
    $("wstop").hidden = v !== "stop";
    $("whome").hidden = v !== "home";
  }
  function stepPup(d) {
    if (phase !== "ready") return;
    var i = B.map(function (b) { return b.id; }).indexOf(pupId);
    pupId = B[(i + d + B.length) % B.length].id;
    st.last = pupId; save(); paintReady();
    if (window.PuppySound) PuppySound.play("pop");
    say(byId(pupId).name + " is ready to walk.");
  }
  function surprise() {
    if (phase !== "ready") return;
    var met = window.PuppyPals && PuppyPals.met ? PuppyPals.met() : [];
    var pool = met.filter(function (id) { return id !== pupId && byId(id); });
    if (pool.length < 1) pool = B.map(function (b) { return b.id; }).filter(function (id) { return id !== pupId; });
    pupId = pool[Math.floor(Math.random() * pool.length)];
    st.last = pupId; save(); paintReady();
    if (window.PuppySound) PuppySound.play("yay");
    say("Surprise pal! " + byId(pupId).name + " wants a walk.");
  }
  function start() {
    if (phase !== "ready") return;
    choices = []; step = 0; picked = null;
    st.last = pupId; save();
    show("stop"); paintStop();
    if (window.PuppySound) PuppySound.play("bark", byId(pupId));
    say("Strolling with " + byId(pupId).name + ".");
    var first = $("wchoices").querySelector(".wchoice");
    if (first) first.focus({ preventScroll: true });
  }
  function choose(i) {
    if (phase !== "stop" || picked) return;
    var c = STOPS[step].choices[i];
    if (!c) return;
    picked = c.id; choices[step] = c.id;
    $("wchoices").querySelectorAll(".wchoice").forEach(function (btn) {
      btn.disabled = true;
      btn.setAttribute("aria-pressed", String(btn.dataset.id === c.id));
    });
    var line = moment(byId(pupId), STOPS[step].id, c.id, weatherFor(todayKey()));
    $("wreply").textContent = line;
    $("won").hidden = false;
    $("won").textContent = step === STOPS.length - 1 ? "Head home 🏡" : "On we go →";
    say(line);
    if (window.PuppySound) PuppySound.play("pop");
    $("won").focus({ preventScroll: true });
  }
  function finishWalk() {
    var key = todayKey(), was = !!st.days[key], sid = souvenir(choices);
    if (!sid) return { was: was, souvenir: "" };
    st.days[key] = { pup: pupId, weather: weatherFor(key), choices: choices.slice(), souvenir: sid };
    st.last = pupId;
    trim(st.days); save(); label();
    return { was: was, souvenir: sid };
  }
  function paintHome(was) {
    var key = todayKey(), day = st.days[key];
    if (!day) { show("ready"); paintReady(); return; }
    var b = byId(day.pup), s = souvenirOf(day.souvenir);
    $("wart3").innerHTML = art(b, "h");
    $("wart3").classList.remove("wkpop"); void $("wart3").offsetWidth; $("wart3").classList.add("wkpop");
    $("wsouvenir").textContent = s.emoji + " " + s.name;
    $("wending").textContent = ending(b, day.weather, s.id);
    paintWeek($("wweek2"));
    say((was ? "Updated today's souvenir: " : "New souvenir: ") + s.name + ". " + count() + (count() === 1 ? " walk." : " walks."));
    if (window.PuppySound) PuppySound.play(was ? "yay" : "fanfare");
    if (window.PuppySound) PuppySound.play("bark", b);
    if (window.PuppyPals && PuppyPals.toast) PuppyPals.toast((was ? "🔄 Today's walk is now a " : "🦮 You found a ") + s.name + " " + s.emoji);
    $("wback").focus({ preventScroll: true });
  }
  function advance() {
    if (phase !== "stop" || !picked) return;
    if (step < STOPS.length - 1) {
      step++; picked = null; paintStop();
      var first = $("wchoices").querySelector(".wchoice");
      if (first) first.focus({ preventScroll: true });
    } else {
      var res = finishWalk();
      show("home"); paintHome(res.was);
    }
  }

  $("wprev").onclick = function () { stepPup(-1); };
  $("wnextpup").onclick = function () { stepPup(1); };
  $("wsurprise").onclick = surprise;
  $("wgo").onclick = start;
  $("wchoices").addEventListener("click", function (e) {
    var t = e.target.closest(".wchoice"); if (!t || t.disabled) return;
    choose(STOPS[step].choices.findIndex(function (c) { return c.id === t.dataset.id; }));
  });
  $("won").onclick = advance;
  $("wback").onclick = function () { show("ready"); paintReady(); say(""); $("wgo").focus({ preventScroll: true }); };
  $("walkbtn").onclick = function () {
    st = load();
    var day = st.days[todayKey()];
    pupId = day && byId(day.pup) ? day.pup : (byId(st.last) ? st.last : pupFor(todayKey()));
    show("ready"); paintReady(); say("");
    dlg.showModal();
    $("wgo").focus({ preventScroll: true });
  };
  $("wclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("walkbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (phase === "ready") {
      if (e.key === "ArrowRight") { e.preventDefault(); stepPup(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepPup(-1); }
      else if (e.key === "n" || e.key === "N") { e.preventDefault(); surprise(); }
      else if (e.key === "Enter" && e.target.id !== "wgo" && e.target.id !== "wsurprise" && e.target.id !== "wprev" && e.target.id !== "wnextpup") { e.preventDefault(); start(); }
    } else if (phase === "stop" && !picked && (e.key === "1" || e.key === "2" || e.key === "3")) {
      e.preventDefault(); choose(Number(e.key) - 1);
    } else if (phase === "stop" && picked && e.key === "Enter" && e.target.id !== "won") {
      e.preventDefault(); advance();
    }
  });
  label();
  window.PuppyWalk = {
    weathers: function () { return WEATHERS.map(function (w) { return w.id; }); },
    stops: function () { return STOPS.map(function (s) { return { id: s.id, title: s.title, choices: s.choices.map(function (c) { return c.id; }) }; }); },
    souvenirs: function () { return SOUVENIRS.map(function (s) { return s.id; }); },
    weatherFor: weatherFor, pupFor: pupFor, souvenir: souvenir, moment: moment, setup: setupLine, ending: ending,
    shiftDate: shiftDate, today: todayKey, setToday: function (k) { forced = parseDate(k) ? k : null; },
    week: function (key) { return weekOf(key || todayKey()); },
    get: function () { return JSON.parse(JSON.stringify(st)); }, count: count, record: record, maxDays: MAX_DAYS
  };
})();
