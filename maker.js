/* 🎨 Pup Maker: build your very own pup from the same parts as the gallery (ears, coat, markings, tail, fluff,
   eye colour and collar), give it a name, and see which real breed it looks most like. Saved in localStorage (puppyPals.myPup). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.myPup", NAME_MAX = 16;
  var PARTS = [
    { key: "ears", label: "Ears", opts: [["pointy", "Pointy"], ["floppy", "Floppy"], ["fold", "Folded"], ["bat", "Big bat"], ["long", "Long"], ["rose", "Rosy"]] },
    { key: "coat", label: "Coat", swatch: true, opts: [["#e8964a", "Fox orange"], ["#f3e2c4", "Cream"], ["#c9a06b", "Honey"], ["#8b5a3c", "Cocoa"], ["#3b3030", "Black"], ["#a9a9b3", "Silver"], ["#ffffff", "Snow white"], ["#b5553a", "Ruby red"]] },
    { key: "marks", label: "Markings", opts: [["none", "None"], ["urajiro", "Cream cheeks"], ["spots", "Spots"], ["patchL", "Eye patch"], ["socks", "Socks"], ["saddle", "Saddle"]] },
    { key: "tail", label: "Tail", opts: [["curl", "Curly"], ["plume", "Plume"], ["whip", "Wavy"], ["pom", "Pom-pom"], ["stub", "Stubby"]] },
    { key: "fluff", label: "Fluff", opts: [["0", "Smooth"], ["1", "Ruffly"], ["2", "Fluffy"], ["3", "Cotton ball"]] },
    { key: "eyes", label: "Eyes", swatch: true, opts: [["#2b1d1d", "Dark brown"], ["#7a4a22", "Amber"], ["#4f8fd6", "Sky blue"], ["#4e9a63", "Green"]] },
    { key: "collar", label: "Collar", swatch: true, opts: [["#ff7aa8", "Pink"], ["#e8455c", "Red"], ["#3a6ea5", "Blue"], ["#f2b631", "Gold"], ["#7cc68a", "Mint"], ["#a77bff", "Lilac"]] }
  ];
  var IDEAS = ["Mochi", "Biscuit", "Dango", "Peanut", "Waffle", "Sushi", "Pudding", "Noodle", "Maple", "Pickle", "Tofu", "Cookie", "Sprout", "Bao"];
  var DEF = { ears: "pointy", coat: "#e8964a", marks: "urajiro", tail: "curl", fluff: "1", eyes: "#2b1d1d", collar: "#ff7aa8", name: "" };
  function part(k) { return PARTS.filter(function (p) { return p.key === k; })[0]; }
  function valid(k, v) { var p = part(k); return !!p && p.opts.some(function (o) { return o[0] === v; }); }
  function cleanName(s) { return String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX); }
  function load() {
    var o = {}, raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    PARTS.forEach(function (p) { o[p.key] = raw && valid(p.key, String(raw[p.key])) ? String(raw[p.key]) : DEF[p.key]; });
    o.name = raw ? cleanName(raw.name) : ""; return o;
  }
  var me = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(me)); } catch (e) {} }
  function light(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; }
  // turn the choices into a breed-like object the gallery's own DogArt generator can draw
  function toBreed(o) {
    o = o || me;
    var lt = light(o.coat), marks = o.marks === "none" ? [] : [o.marks];
    return { id: "mypup", name: o.name || "My pup", look: { ears: o.ears, earSize: o.ears === "bat" ? 1.1 : 1, tail: o.tail, fluff: +o.fluff, collar: o.collar,
      coat: { base: o.coat, light: o.coat === "#ffffff" || o.coat === "#f3e2c4" ? "#fffaf2" : "#fff6ea", second: lt ? "#6b4a35" : "#f3e2c4" },
      marks: marks, eyes: { color: o.eyes, size: 1.05 }, smile: true } };
  }
  function hexDist(a, b) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var dr = (x >> 16) - (y >> 16), dg = ((x >> 8) & 255) - ((y >> 8) & 255), db = (x & 255) - (y & 255);
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  // the real breed whose look shares the most parts with your pup
  function lookalike(o) {
    o = o || me;
    var best = null;
    B.forEach(function (b) {
      var L = b.look || {}, c = (L.coat && L.coat.base) || "#d9a066", s = 0;
      if ((L.ears || "floppy") === o.ears) s += 3;
      if ((L.tail || "curl") === o.tail) s += 2;
      if ((L.fluff || 0) === +o.fluff) s += 2;
      if (o.marks !== "none" && (L.marks || []).indexOf(o.marks) >= 0) s += 2;
      if (o.marks === "none" && !(L.marks || []).length) s += 1;
      s += Math.max(0, 3 - hexDist(c, o.coat) / 60);
      if (!best || s > best.s || (s === best.s && b.name < best.b.name)) best = { b: b, s: s };
    });
    return best.b;
  }
  var dlg = $("maker");
  function chipHtml(p) {
    return p.opts.map(function (o) {
      var on = me[p.key] === o[0];
      return p.swatch
        ? '<button type="button" class="sw mksw" data-k="' + p.key + '" data-v="' + o[0] + '" style="--c:' + o[0] + '" aria-pressed="' + on + '" aria-label="' + o[1] + '" title="' + o[1] + '"></button>'
        : '<button type="button" class="mkchip" data-k="' + p.key + '" data-v="' + o[0] + '" aria-pressed="' + on + '">' + o[1] + "</button>";
    }).join("");
  }
  function paint(pop) {
    var b = toBreed(), look = lookalike();
    $("mkart").innerHTML = DogArt.svg(b, { id: "mypup", title: false });
    $("mkart").setAttribute("aria-label", "Your pup " + (me.name || "") + ": " + describe());
    $("mkname").value = me.name;
    $("mklook").innerHTML = "";
    var t = document.createElement("span"); t.textContent = (me.name || "Your pup") + " looks a lot like the "; $("mklook").appendChild(t);
    var bb = document.createElement("b"); bb.textContent = look.name; $("mklook").appendChild(bb);
    $("mklook").appendChild(document.createTextNode(" from " + look.origin + "!"));
    $("mkmeet").dataset.id = look.id; $("mkmeet").textContent = "Meet the " + look.name + " 🐾";
    PARTS.forEach(function (p) { $("mk-" + p.key).querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.v === me[p.key])); }); });
    $("makerbtn").textContent = me.name ? "🎨 " + me.name : "🎨 Pup Maker";
    if (pop) { var a = $("mkart"); a.classList.remove("mkpop"); void a.offsetWidth; a.classList.add("mkpop"); }
  }
  function describe() {
    return PARTS.map(function (p) { var o = p.opts.filter(function (x) { return x[0] === me[p.key]; })[0]; return p.label.toLowerCase() + " " + o[1].toLowerCase(); }).join(", ");
  }
  function set(k, v) {
    if (!valid(k, v)) return; me[k] = v; save(); paint(true);
    if (window.PuppySound) PuppySound.play("pop");
    var p = part(k), o = p.opts.filter(function (x) { return x[0] === v; })[0];
    $("mklive").textContent = p.label + ": " + o[1] + ". Looks like the " + lookalike().name + ".";
  }
  function randomize() {
    PARTS.forEach(function (p) { me[p.key] = p.opts[Math.floor(Math.random() * p.opts.length)][0]; });
    if (!me.name) me.name = IDEAS[Math.floor(Math.random() * IDEAS.length)];
    save(); paint(true);
    if (window.PuppySound) PuppySound.play("yay");
    $("mklive").textContent = "Surprise pup! " + describe() + ". Looks like the " + lookalike().name + ".";
  }
  function reset() { var n = me.name; me = JSON.parse(JSON.stringify(DEF)); me.name = n; save(); paint(true); $("mklive").textContent = "Back to the starter pup."; }
  $("mkparts").innerHTML = PARTS.map(function (p) {
    return '<div class="mkrow"><span class="mklbl" id="mkl-' + p.key + '">' + p.label + '</span><div class="mkopts' + (p.swatch ? " sws" : "") + '" id="mk-' + p.key + '" role="group" aria-labelledby="mkl-' + p.key + '">' + chipHtml(p) + "</div></div>";
  }).join("");
  $("mkparts").addEventListener("click", function (e) { var x = e.target.closest("button[data-k]"); if (x) set(x.dataset.k, x.dataset.v); });
  $("mkname").addEventListener("input", function () { me.name = cleanName($("mkname").value); save(); var pos = $("mkname").selectionStart; paint(false); try { $("mkname").setSelectionRange(pos, pos); } catch (e) {} });
  $("mknameform").addEventListener("submit", function (e) { e.preventDefault(); $("mkname").blur(); });
  $("mkdice").onclick = function () { var n; do { n = IDEAS[Math.floor(Math.random() * IDEAS.length)]; } while (n === me.name); me.name = n; save(); paint(true); $("mklive").textContent = "Name: " + n; };
  $("mkrandom").onclick = randomize;
  $("mkreset").onclick = reset;
  $("mkmeet").onclick = function () { var id = $("mkmeet").dataset.id; dlg.dataset.meeting = "1"; dlg.close(); delete dlg.dataset.meeting; if (window.PuppyPals) PuppyPals.openBreed(id); };
  $("makerbtn").onclick = function () { me = load(); paint(false); $("mklive").textContent = ""; dlg.showModal(); $("mkrandom").focus({ preventScroll: true }); };
  $("mkclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (!dlg.dataset.meeting) $("makerbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); randomize(); }
  });
  paint(false);
  window.PuppyMaker = { parts: function () { return PARTS.map(function (p) { return { key: p.key, opts: p.opts.map(function (o) { return o[0]; }) }; }); },
    get: function () { return JSON.parse(JSON.stringify(me)); }, set: set, toBreed: toBreed, lookalike: function (o) { return lookalike(o).id; }, cleanName: cleanName };
})();
