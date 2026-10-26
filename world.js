/* 🌍 Pups around the world: every breed grouped by the country it comes from, with a flag, a hello in
   that country's language and how many of its pups you've met. The last country is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.world";
  var C = [
    { id: "jp", name: "Japan", flag: "🇯🇵", hi: "Konnichiwa!", re: /Japan/ },
    { id: "de", name: "Germany", flag: "🇩🇪", hi: "Hallo!", re: /German/ },
    { id: "gb", name: "United Kingdom", flag: "🇬🇧", hi: "Hiya!", re: /England|Scotland|Wales|United Kingdom|Anglo-Scottish/ },
    { id: "fr", name: "France", flag: "🇫🇷", hi: "Bonjour!", re: /France/ },
    { id: "us", name: "United States", flag: "🇺🇸", hi: "Howdy!", re: /United States/ },
    { id: "ru", name: "Russia", flag: "🇷🇺", hi: "Privet!", re: /Russia|Siberia/ },
    { id: "cn", name: "China", flag: "🇨🇳", hi: "Nǐ hǎo!", re: /China|Tibet/ },
    { id: "ch", name: "Switzerland", flag: "🇨🇭", hi: "Grüezi!", re: /Swiss|Switzerland/ },
    { id: "it", name: "Italy", flag: "🇮🇹", hi: "Ciao!", re: /Ital/ },
    { id: "pl", name: "Poland", flag: "🇵🇱", hi: "Cześć!", re: /Poland/ },
    { id: "mx", name: "Mexico", flag: "🇲🇽", hi: "¡Hola!", re: /Mexico/ },
    { id: "mt", name: "Malta", flag: "🇲🇹", hi: "Bonġu!", re: /Malta/ },
    { id: "hr", name: "Croatia", flag: "🇭🇷", hi: "Bok!", re: /Croatia/ },
    { id: "ca", name: "Canada", flag: "🇨🇦", hi: "Hello! Bonjour!", re: /Canada/ },
    { id: "es", name: "Spain", flag: "🇪🇸", hi: "¡Hola!", re: /Spain/ },
    { id: "be", name: "Belgium", flag: "🇧🇪", hi: "Hallo! Bonjour!", re: /Belgium/ },
    { id: "ie", name: "Ireland", flag: "🇮🇪", hi: "Dia duit!", re: /Ireland/ },
    { id: "pt", name: "Portugal", flag: "🇵🇹", hi: "Olá!", re: /Portugal/ },
    { id: "hu", name: "Hungary", flag: "🇭🇺", hi: "Szia!", re: /Hungary/ },
    { id: "fi", name: "Finland", flag: "🇫🇮", hi: "Moi!", re: /Finland/ },
    { id: "no", name: "Norway", flag: "🇳🇴", hi: "Hei!", re: /Norway/ },
    { id: "kr", name: "South Korea", flag: "🇰🇷", hi: "Annyeong!", re: /Korea/ },
    { id: "th", name: "Thailand", flag: "🇹🇭", hi: "Sawasdee!", re: /Thailand/ },
    { id: "af", name: "Afghanistan", flag: "🇦🇫", hi: "Salaam!", re: /Afghanistan/ },
    { id: "cd", name: "DR Congo", flag: "🇨🇩", hi: "Mbote!", re: /Congo/ },
    { id: "zw", name: "Zimbabwe", flag: "🇿🇼", hi: "Mhoro!", re: /Zimbabwe/ },
    { id: "za", name: "South Africa", flag: "🇿🇦", hi: "Sawubona!", re: /South Africa/ },
    { id: "ml", name: "Mali & Niger", flag: "🇲🇱", hi: "I ni ce!", re: /Mali/ },
    { id: "pe", name: "Peru", flag: "🇵🇪", hi: "¡Hola! Allillanchu!", re: /Peru/ },
    { id: "br", name: "Brazil", flag: "🇧🇷", hi: "Olá!", re: /Brazil/ },
    { id: "au", name: "Australia", flag: "🇦🇺", hi: "G'day!", re: /Australia/ }
  ];
  function countriesOf(b) { return C.filter(function (c) { return c.re.test(b.origin); }).map(function (c) { return c.id; }); }
  function pupsOf(id) {
    var c = byId(id); if (!c) return [];
    return B.filter(function (b) { return c.re.test(b.origin); }).sort(function (x, y) { return x.name.localeCompare(y.name); });
  }
  function byId(id) { return C.filter(function (c) { return c.id === id; })[0] || null; }
  // most pups first, then A to Z
  var ORDER = C.slice().sort(function (a, b) { return pupsOf(b.id).length - pupsOf(a.id).length || a.name.localeCompare(b.name); });
  function met() { return window.PuppyPals ? PuppyPals.met() : []; }
  function metIn(id, m) { m = m || met(); return pupsOf(id).filter(function (b) { return m.indexOf(b.id) >= 0; }).length; }
  function visited(m) { m = m || met(); return ORDER.filter(function (c) { return metIn(c.id, m) > 0; }).length; }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
  var dlg = $("world"), cur = ORDER[0].id;
  function load() { try { var v = localStorage.getItem(KEY); if (byId(v)) return v; } catch (e) {} return ORDER[0].id; }
  function save() { try { localStorage.setItem(KEY, cur); } catch (e) {} }
  function status(id, m) {
    var c = byId(id), n = pupsOf(id).length, k = metIn(id, m);
    if (k === n) return n === 1 ? "You've met the pup from " + c.name + "! 🎉" : "You've met all " + n + " pups from " + c.name + "! 🎉";
    return (n === 1 ? "1 pup" : n + " pups") + " from " + c.name + " · you've met " + k;
  }
  function renderFlags(m) {
    $("wflags").innerHTML = ORDER.map(function (c) {
      var n = pupsOf(c.id).length, k = metIn(c.id, m), done = k === n;
      return '<button type="button" class="wflag' + (done ? " done" : "") + '" data-id="' + c.id + '" aria-pressed="' + (c.id === cur) + '" aria-label="' + c.name + ", " + n + (n === 1 ? " pup" : " pups") + (done ? ", all met" : "") + '" title="' + c.name + '">' +
        '<span class="wf" aria-hidden="true">' + c.flag + '</span><span class="wn" aria-hidden="true">' + n + "</span></button>";
    }).join("");
  }
  function render(pop) {
    var m = met(), c = byId(cur), pups = pupsOf(cur);
    renderFlags(m);
    $("wcount").textContent = "🗺️ " + ORDER.length + " countries · pups met from " + visited(m) + " of them";
    $("wname").innerHTML = '<span aria-hidden="true">' + c.flag + "</span> " + esc(c.name);
    $("whi").textContent = "“" + c.hi + "” 👋";
    $("wstat").textContent = status(cur, m);
    $("wpups").innerHTML = pups.map(function (b) {
      var seen = m.indexOf(b.id) >= 0, nick = window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : "";
      return '<button type="button" class="wpup' + (seen ? " met" : "") + '" data-id="' + b.id + '" aria-label="Meet ' + esc(b.name) + (seen ? ", already met" : ", new friend") + '">' +
        '<span class="wart" aria-hidden="true">' + art(b) + '</span><span class="wpn">' + esc(nick || b.name) + "</span>" + (seen ? '<span class="wpaw" aria-hidden="true">🐾</span>' : '<span class="wnew" aria-hidden="true">new!</span>') + "</button>";
    }).join("");
    dlg.dataset.country = cur;
    if (pop) { var p = $("wpanel"); p.classList.remove("wpop"); void p.offsetWidth; p.classList.add("wpop"); }
  }
  function pick(id, quiet) {
    if (!byId(id)) return; cur = id; save(); render(true);
    if (!quiet && window.PuppySound) PuppySound.play("pop");
    $("wlive").textContent = byId(id).name + ". " + status(id);
  }
  function step(d) { var i = ORDER.map(function (c) { return c.id; }).indexOf(cur); pick(ORDER[(i + d + ORDER.length) % ORDER.length].id); }
  function trip() {
    var others = ORDER.filter(function (c) { return c.id !== cur; }), m = met();
    // prefer a country with pups you haven't met yet
    var fresh = others.filter(function (c) { return metIn(c.id, m) < pupsOf(c.id).length; });
    var pool = fresh.length ? fresh : others;
    pick(pool[Math.floor(Math.random() * pool.length)].id);
    var f = dlg.querySelector('.wflag[aria-pressed="true"]'); if (f && f.scrollIntoView) f.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  $("wflags").addEventListener("click", function (e) { var b = e.target.closest(".wflag"); if (b) pick(b.dataset.id); });
  $("wpups").addEventListener("click", function (e) {
    var b = e.target.closest(".wpup"); if (!b) return;
    dlg.dataset.meeting = "1"; dlg.close(); delete dlg.dataset.meeting;
    if (window.PuppyPals) PuppyPals.openBreed(b.dataset.id);
  });
  $("wtrip").onclick = trip;
  $("worldbtn").onclick = function () { cur = load(); render(false); $("wlive").textContent = ""; dlg.showModal(); $("wtrip").focus({ preventScroll: true }); };
  $("wclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (!dlg.dataset.meeting) $("worldbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /SELECT|INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "r" || e.key === "R") { e.preventDefault(); trip(); }
  });
  window.PuppyWorld = { countries: function () { return ORDER.map(function (c) { return { id: c.id, name: c.name, flag: c.flag, hi: c.hi, pups: pupsOf(c.id).map(function (b) { return b.id; }) }; }); },
    countriesOf: countriesOf, visited: visited, status: status, current: function () { return cur; }, pick: pick };
})();
