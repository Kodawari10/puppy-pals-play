/* 📮 Postcards: each pup writes you a postcard from home, with a hello in its language, a trait and its fun fact.
   Pick a stamp, send it, and collect them in an album. Saved in localStorage (puppyPals.postcards). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.postcards";
  var STAMPS = [
    { id: "heart", emoji: "❤️", name: "Heart" },
    { id: "paw", emoji: "🐾", name: "Paw" },
    { id: "star", emoji: "⭐", name: "Star" },
    { id: "flower", emoji: "🌸", name: "Flower" },
    { id: "rainbow", emoji: "🌈", name: "Rainbow" }
  ];
  function stampOf(id) { return STAMPS.filter(function (s) { return s.id === id; })[0] || STAMPS[0]; }
  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function nick(b) { return window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : ""; }
  function nameOf(b) { var n = nick(b); return n ? n + " the " + b.name : "the " + b.name; }
  function country(b) {
    if (!window.PuppyWorld) return { flag: "🏳️", hi: "Hello!", name: b.origin };
    var id = PuppyWorld.countriesOf(b)[0], c = PuppyWorld.countries().filter(function (x) { return x.id === id; })[0];
    return c ? { flag: c.flag, hi: c.hi, name: c.name } : { flag: "🏳️", hi: "Hello!", name: b.origin };
  }
  function load() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    var cards = {}, last = "shiba", stamp = "heart";
    if (raw && raw.cards && typeof raw.cards === "object") {
      Object.keys(raw.cards).forEach(function (id) {
        var v = raw.cards[id]; if (!byId(id) || !v) return;
        var sid = typeof v === "string" ? v : v.stamp;
        if (stampOf(sid).id !== sid && sid !== "heart") { if (!STAMPS.some(function (s) { return s.id === sid; })) return; }
        if (!STAMPS.some(function (s) { return s.id === sid; })) sid = "heart";
        cards[id] = { stamp: sid, at: v && v.at && /^\d{4}-\d{2}-\d{2}$/.test(v.at) ? v.at : "" };
      });
    }
    if (raw && byId(raw.last)) last = raw.last;
    if (raw && STAMPS.some(function (s) { return s.id === raw.stamp; })) stamp = raw.stamp;
    return { cards: cards, last: last, stamp: stamp };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function count() { return Object.keys(st.cards).length; }
  // four short lines, always from this pup's own hello, home, traits and fun fact
  function write(b, stamp) {
    b = b || byId(st.last); stamp = stampOf(stamp || st.stamp);
    var c = country(b), t = b.traits[0].toLowerCase();
    return [
      c.hi + " from " + b.origin + "!",
      "Wish you were here! I've been feeling very " + t + " today, and I stuck a " + stamp.name.toLowerCase() + " stamp on this card for you.",
      "Did you know? " + b.fact.replace(/\s+$/, ""),
      "With love, " + nameOf(b) + " 🐾"
    ];
  }
  var st = load(), dlg = $("post"), view = "write";
  function art(b, tag) { var d = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b; return DogArt.svg(d, { id: "pc-" + tag + "-" + b.id, title: false }); }
  function label() { var n = count(); $("postbest").textContent = n ? n + " card" + (n === 1 ? "" : "s") : ""; }
  function paintWrite(pop) {
    var b = byId(st.last), c = country(b), lines = write(b), sent = !!st.cards[b.id];
    $("pcphoto").innerHTML = art(b, "w");
    $("pcflag").textContent = c.flag;
    $("pcstampem").textContent = stampOf(st.stamp).emoji;
    $("pcfrom").textContent = "A postcard from " + c.name;
    $("pcmsg").innerHTML = "";
    lines.forEach(function (line) { var p = document.createElement("p"); p.textContent = line; $("pcmsg").appendChild(p); });
    $("pcpup").textContent = b.name;
    $("pcstamps").querySelectorAll(".pcstampbtn").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.id === st.stamp)); });
    $("pcsend").textContent = sent ? "🔄 Update stamp" : "📤 Send postcard";
    $("pcalbumbtn").textContent = "📬 Album" + (count() ? " (" + count() + ")" : "");
    $("pccard").setAttribute("aria-label", "Postcard from " + b.name + " in " + c.name);
    if (pop) { $("pccard").classList.remove("pcpop"); void $("pccard").offsetWidth; $("pccard").classList.add("pcpop"); }
  }
  function paintAlbum() {
    var ids = Object.keys(st.cards).sort(function (a, c) { return byId(a).name.localeCompare(byId(c).name); });
    $("pccount").textContent = ids.length ? "📬 " + ids.length + " of " + B.length + " postcards collected" : "No postcards yet. Send one from the write desk!";
    $("pcgrid").innerHTML = ids.map(function (id) {
      var b = byId(id), c = country(b), s = stampOf(st.cards[id].stamp);
      return '<button type="button" class="pcmini" data-id="' + id + '" aria-label="Postcard from ' + b.name + '">' +
        '<span class="pcminiart" aria-hidden="true">' + art(b, "a") + '</span>' +
        '<span class="pcministamp" aria-hidden="true">' + c.flag + s.emoji + "</span>" +
        '<span class="pcminin">' + b.name + "</span></button>";
    }).join("");
  }
  function show(v) {
    view = v; $("pcwrite").hidden = v !== "write"; $("pcalbum").hidden = v !== "album";
    if (v === "album") { paintAlbum(); $("pcback").focus({ preventScroll: true }); }
    else { paintWrite(false); $("pcsend").focus({ preventScroll: true }); }
  }
  function step(d) {
    var i = B.map(function (b) { return b.id; }).indexOf(st.last);
    st.last = B[(i + d + B.length) % B.length].id; save(); paintWrite(true);
    if (window.PuppySound) PuppySound.play("pop");
    $("pclive").textContent = "Postcard from " + byId(st.last).name + ".";
  }
  function surprise() {
    var ids = B.map(function (b) { return b.id; }).filter(function (id) { return id !== st.last; });
    // prefer a pup you haven't had a card from yet
    var fresh = ids.filter(function (id) { return !st.cards[id]; });
    var pool = fresh.length ? fresh : ids;
    st.last = pool[Math.floor(Math.random() * pool.length)];
    st.stamp = STAMPS[Math.floor(Math.random() * STAMPS.length)].id;
    save(); paintWrite(true);
    if (window.PuppySound) PuppySound.play("yay");
    $("pclive").textContent = "Surprise! A postcard from " + byId(st.last).name + ".";
  }
  function send() {
    var b = byId(st.last), was = !!st.cards[b.id];
    st.cards[b.id] = { stamp: st.stamp, at: today() }; save(); label(); paintWrite(true);
    $("pccard").classList.remove("pcsent"); void $("pccard").offsetWidth; $("pccard").classList.add("pcsent");
    if (window.PuppySound) PuppySound.play(was ? "pop" : "fanfare");
    $("pclive").textContent = was ? "Updated the " + b.name + " postcard." : "Sent! Postcard from " + b.name + " added to your album. " + count() + " of " + B.length + ".";
    if (!was && window.PuppyPals && PuppyPals.toast) PuppyPals.toast("📮 Postcard from " + b.name + " delivered!");
  }
  $("pcstamps").innerHTML = STAMPS.map(function (s) {
    return '<button type="button" class="pcstampbtn" data-id="' + s.id + '" aria-pressed="false" aria-label="' + s.name + ' stamp" title="' + s.name + '">' + s.emoji + "</button>";
  }).join("");
  $("pcstamps").addEventListener("click", function (e) {
    var t = e.target.closest(".pcstampbtn"); if (!t) return;
    st.stamp = t.dataset.id; save(); paintWrite(false);
    if (window.PuppySound) PuppySound.play("pop");
    $("pclive").textContent = stampOf(st.stamp).name + " stamp.";
  });
  $("pcprev").onclick = function () { step(-1); };
  $("pcnext").onclick = function () { step(1); };
  $("pcsurprise").onclick = surprise;
  $("pcsend").onclick = send;
  $("pcalbumbtn").onclick = function () { show("album"); };
  $("pcback").onclick = function () { show("write"); };
  $("pcgrid").addEventListener("click", function (e) {
    var t = e.target.closest(".pcmini"); if (!t) return;
    st.last = t.dataset.id; st.stamp = st.cards[st.last].stamp; save(); show("write");
    $("pclive").textContent = "Opened the postcard from " + byId(st.last).name + ".";
  });
  $("postbtn").onclick = function () { st = load(); show("write"); $("pclive").textContent = ""; dlg.showModal(); $("pcsend").focus({ preventScroll: true }); };
  $("pcclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("postbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || $("pcalbum").hidden === false) return;
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); send(); }
    else if (e.key === "n" || e.key === "N") { e.preventDefault(); surprise(); }
    else if (e.key === "a" || e.key === "A") { e.preventDefault(); show("album"); }
  });
  label();
  window.PuppyPost = { write: write, stamps: function () { return STAMPS.map(function (s) { return s.id; }); }, get: function () { return JSON.parse(JSON.stringify(st)); }, country: country, count: count };
})();
