(function () {
  "use strict";
  var B = window.BREEDS, SIZES = window.BREED_SIZES, GROUPS = window.BREED_GROUPS;
  var SIZE_RANK = {}; SIZES.forEach(function (s, i) { SIZE_RANK[s] = i; });
  var $ = function (id) { return document.getElementById(id); };
  var state = { q: "", sizes: [], groups: [], sort: "az", fav: false };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2.1 0 3.9 1.2 5.1 3 1.2-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';

  // ---------- favorites (saved in localStorage) ----------
  var FAV_KEY = "puppyPals.favs", favs = [], pendingRender = false;
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { favs = []; }
  if (!Array.isArray(favs)) favs = [];
  favs = favs.filter(function (id) { return B.some(function (b) { return b.id === id; }); });
  function isFav(id) { return favs.indexOf(id) >= 0; }
  function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {} }
  function favLabel(b, on) { return on ? "Remove " + b.name + " from favorites" : "Add " + b.name + " to favorites"; }
  function paintFav(btn, b, beat) {
    var on = isFav(b.id);
    btn.setAttribute("aria-pressed", on); btn.setAttribute("aria-label", favLabel(b, on));
    if (beat && on) { btn.classList.remove("beat"); void btn.offsetWidth; btn.classList.add("beat"); }
  }
  function toggleFav(b) {
    var i = favs.indexOf(b.id);
    if (i >= 0) favs.splice(i, 1); else favs.push(b.id);
    saveFavs(); $("favn").textContent = favs.length;
    document.querySelectorAll('.fav[data-id="' + b.id + '"]').forEach(function (f) { paintFav(f, b, true); });
    if (dlg.open && visible[current] === b) paintFav($("dfav"), b, true);
    sfx(isFav(b.id) ? "heart" : "unheart");
  }
  function sfx(name, b) { if (window.PuppySound) PuppySound.play(name, b); }

  // ---------- Pup Passport: every pup you open gets a paw stamp (saved in localStorage) ----------
  var MET_KEY = "puppyPals.met", met = [];
  try { met = JSON.parse(localStorage.getItem(MET_KEY) || "[]"); } catch (e) { met = []; }
  if (!Array.isArray(met)) met = [];
  met = met.filter(function (id, i) { return met.indexOf(id) === i && B.some(function (b) { return b.id === id; }); });
  function isMet(id) { return met.indexOf(id) >= 0; }
  var STAMP = '<span class="stamp" title="Met!"><span aria-hidden="true">🐾</span><span class="sr">, already met</span></span>';
  function milestoneMsg(n) {
    var half = Math.ceil(B.length / 2);
    if (n === B.length) return "🏆 You met all " + B.length + " pups! You're a true Puppy Pal!";
    if (n === 1) return "🎉 Your first pup friend! Collect paw stamps in your Pup Passport.";
    if (n === half) return "💖 Halfway there! " + n + " of " + B.length + " pups met.";
    if (n === 5 || n === 10 || n === 25) return (n === 25 ? "🌈 " : n === 10 ? "🌟 " : "🐾 ") + n + " pups met! You're making friends fast.";
    return "";
  }
  function paintPassport() {
    var n = met.length, done = n === B.length;
    $("metn").textContent = n; $("mett").textContent = B.length;
    $("ppfill").style.width = (100 * n / B.length) + "%";
    var bar = $("ppbar"); bar.setAttribute("aria-valuenow", n); bar.setAttribute("aria-valuemax", B.length);
    bar.setAttribute("aria-valuetext", n + " of " + B.length + " pups met");
    $("passport").classList.toggle("complete", done);
    $("meetbtn").textContent = done ? "Visit a random pal 🎲" : "Meet a new pup 🎲";
  }
  function meet(b) {
    var fresh = !isMet(b.id);
    $("dnew").hidden = !fresh;
    if (!fresh) return false;
    met.push(b.id);
    try { localStorage.setItem(MET_KEY, JSON.stringify(met)); } catch (e) {}
    var c = document.querySelector('.card[data-id="' + b.id + '"]');
    if (c && !c.querySelector(".stamp")) { c.insertAdjacentHTML("beforeend", STAMP); c.querySelector(".stamp").classList.add("new"); }
    paintPassport();
    var msg = milestoneMsg(met.length);
    if (msg) {
      setTimeout(function () { if (window.PuppyPals) PuppyPals.toast(msg); sfx(met.length === B.length ? "fanfare" : "yay"); }, 450);
      var pp = $("passport"); pp.classList.remove("cheer"); void pp.offsetWidth; pp.classList.add("cheer");
    }
    return true;
  }
  function meetRandom() {
    var pool = B.filter(function (b) { return !isMet(b.id); });
    if (!pool.length) pool = B;
    openBreed(pool[Math.floor(Math.random() * pool.length)].id);
  }
  // ---------- Pets: tap "Give pets" (or P) in the dialog; hearts float up and the pup wiggles happily ----------
  var PET_KEY = "puppyPals.pets", pets = {};
  try { pets = JSON.parse(localStorage.getItem(PET_KEY) || "{}"); } catch (e) { pets = {}; }
  if (!pets || typeof pets !== "object" || Array.isArray(pets)) pets = {};
  Object.keys(pets).forEach(function (id) { if (!B.some(function (b) { return b.id === id; }) || !(pets[id] > 0)) delete pets[id]; else pets[id] = Math.floor(pets[id]); });
  var PET_LOVE = 10, HEARTS = ["💕", "💖", "💗", "✨", "🩷"];
  function petCount(id) { return pets[id] || 0; }
  function petText(b) {
    var n = petCount(b.id);
    if (!n) return "";
    return (n >= PET_LOVE ? "🥰 " : "💕 ") + n + (n === 1 ? " pet" : " pets") + (n >= PET_LOVE ? ", best friends!" : "");
  }
  function paintPets(b) {
    $("dpet").setAttribute("aria-label", "Give " + b.name + " pets (P)");
    $("dpetn").textContent = petText(b);
  }
  function hearts(set) {
    set = set || HEARTS;
    if (reduced.matches) return;
    var z = $("zoom"), old = z.querySelectorAll(".pheart");
    for (var k = 0; k < old.length - 9; k++) old[k].remove();
    for (var i = 0; i < 3; i++) {
      var h = document.createElement("span");
      h.className = "pheart"; h.setAttribute("aria-hidden", "true");
      h.textContent = set[Math.floor(Math.random() * set.length)];
      h.style.left = (22 + Math.random() * 56) + "%";
      h.style.animationDelay = (i * 90) + "ms";
      h.style.setProperty("--dx", (Math.random() * 40 - 20).toFixed(0) + "px");
      z.appendChild(h);
      setTimeout(h.remove.bind(h), 1400 + i * 90);
    }
  }
  function pet() {
    var b = visible[current]; if (!b || !dlg.open) return;
    pets[b.id] = petCount(b.id) + 1;
    try { localStorage.setItem(PET_KEY, JSON.stringify(pets)); } catch (e) {}
    paintPets(b); hearts(); sfx("pet", b);
    var a = $("dart"); a.classList.remove("petted"); void a.offsetWidth; a.classList.add("petted");
    if (pets[b.id] === PET_LOVE) setTimeout(function () { toast("🥰 " + b.name + " loves you! " + PET_LOVE + " pets, best friends!"); sfx("yay"); }, 250);
  }
  // ---------- Bath time: tap "Bath" (or B) for a bubbly wash and a shake-off; 5 baths makes a pup squeaky clean ----------
  var BATH_KEY = "puppyPals.baths", BATH_CLEAN = 5, baths = {};
  try { baths = JSON.parse(localStorage.getItem(BATH_KEY) || "{}"); } catch (e) { baths = {}; }
  if (!baths || typeof baths !== "object" || Array.isArray(baths)) baths = {};
  Object.keys(baths).forEach(function (id) {
    var n = Math.floor(baths[id]);
    if (!B.some(function (b) { return b.id === id; }) || !(n > 0)) delete baths[id]; else baths[id] = n;
  });
  function bathCount(id) { return baths[id] || 0; }
  function bathText(b) {
    var n = bathCount(b.id); if (!n) return "";
    return (n >= BATH_CLEAN ? "✨ " : "🫧 ") + n + (n === 1 ? " bath" : " baths") + (n >= BATH_CLEAN ? ", squeaky clean!" : "");
  }
  function paintBath(b) {
    $("dbath").setAttribute("aria-label", "Give " + b.name + " a bath (B)");
    $("dbathn").textContent = bathText(b);
  }
  function bath() {
    var b = visible[current]; if (!b || !dlg.open) return;
    baths[b.id] = bathCount(b.id) + 1;
    try { localStorage.setItem(BATH_KEY, JSON.stringify(baths)); } catch (e) {}
    paintBath(b); hearts(["🫧", "🫧", "💧", "🧼"]);
    var a = $("dart"); a.classList.remove("bathing"); void a.offsetWidth; a.classList.add("bathing");
    $("dbathlive").textContent = b.name + " splashes in the bubbles and shakes off!";
    sfx("pet", b);
    if (baths[b.id] === BATH_CLEAN) setTimeout(function () { toast("✨ " + b.name + " is squeaky clean! " + BATH_CLEAN + " bubbly baths"); sfx("yay"); }, 250);
  }

  // ---------- Snack time: tap "Treat" (or K) to offer dog-safe snacks; each pup has a secret favourite to discover ----------
  var SNACK_KEY = "puppyPals.snacks", snacks = {};
  var SNACKS = [["bone", "🦴", "a bone biscuit"], ["carrot", "🥕", "carrot sticks"], ["potato", "🍠", "sweet potato"], ["apple", "🍎", "apple slices"], ["cheese", "🧀", "a cheese nibble"], ["chicken", "🍗", "chicken bites"]];
  var SNACK_IDS = SNACKS.map(function (x) { return x[0]; });
  try { snacks = JSON.parse(localStorage.getItem(SNACK_KEY) || "{}"); } catch (e) { snacks = {}; }
  if (!snacks || typeof snacks !== "object" || Array.isArray(snacks)) snacks = {};
  Object.keys(snacks).forEach(function (id) {
    var v = snacks[id];
    if (!B.some(function (b) { return b.id === id; }) || !v || !Array.isArray(v.tried)) { delete snacks[id]; return; }
    var t = v.tried.filter(function (x, i) { return SNACK_IDS.indexOf(x) >= 0 && v.tried.indexOf(x) === i; });
    if (!t.length) { delete snacks[id]; return; }
    snacks[id] = { tried: t, n: Math.max(t.length, Math.floor(v.n) || 0) };
  });
  function favSnack(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return SNACK_IDS[h % SNACKS.length]; }
  function snackOf(k) { return SNACKS[SNACK_IDS.indexOf(k)]; }
  function snackFound(id) { var v = snacks[id]; return !!v && v.tried.indexOf(favSnack(id)) >= 0; }
  function snackText(b) {
    var v = snacks[b.id]; if (!v) return "";
    if (snackFound(b.id)) { var f = snackOf(favSnack(b.id)); return "😋 Loves " + f[1] + " " + f[2] + (v.n > 1 ? " · " + v.n + " treats" : ""); }
    return "🍽️ Tried " + v.tried.length + " of " + SNACKS.length + " snacks";
  }
  function paintSnack(b) {
    $("dtreat").setAttribute("aria-label", "Give " + b.name + " a treat (K)");
    $("dtreatn").textContent = snackText(b);
  }
  function treat(pick) {
    var b = visible[current]; if (!b || !dlg.open) return null;
    var v = snacks[b.id] || { tried: [], n: 0 }, fav = favSnack(b.id), was = snackFound(b.id), k;
    if (was) k = fav;
    else {
      var left = SNACK_IDS.filter(function (x) { return v.tried.indexOf(x) < 0; });
      k = pick && left.indexOf(pick) >= 0 ? pick : left[Math.floor(Math.random() * left.length)];
      v.tried.push(k);
    }
    v.n = (v.n || 0) + 1; snacks[b.id] = v;
    try { localStorage.setItem(SNACK_KEY, JSON.stringify(snacks)); } catch (e) {}
    var s = snackOf(k), a = $("dart");
    hearts(k === fav ? [s[1], "💖", "✨"] : [s[1], "✨"]);
    a.classList.remove("munch"); void a.offsetWidth; a.classList.add("munch");
    paintSnack(b);
    if (!was && k === fav) { $("dtreatlive").textContent = "Yum! " + s[2] + " is " + b.name + "'s favourite!"; setTimeout(function () { toast("😋 " + s[1] + " " + cap(s[2]) + " is " + b.name + "'s favourite snack!"); sfx("yay"); }, 250); }
    else { $("dtreatlive").textContent = b.name + (k === fav ? " munches " : " nibbles ") + s[2] + (k === fav ? " happily." : ". Not the favourite, try another!"); sfx("pet", b); }
    return k;
  }
  // ---------- Dress up: pick a collar and a bow colour for each pup (saved in localStorage) ----------
  var OUTFIT_KEY = "puppyPals.outfits", outfits = {}, SLOTS = ["collar", "bow"];
  var DRESS = [["none", "No", ""], ["pink", "Pink", "#ff7aa8"], ["mint", "Mint", "#4fd1a1"], ["sky", "Sky blue", "#5fb2ff"], ["lilac", "Lilac", "#b38cff"], ["sunny", "Sunny yellow", "#ffcc3d"]];
  var DRESS_HEX = {}, DRESS_NAME = {}; DRESS.forEach(function (c) { DRESS_HEX[c[0]] = c[2]; DRESS_NAME[c[0]] = c[1]; });
  try { outfits = JSON.parse(localStorage.getItem(OUTFIT_KEY) || "{}"); } catch (e) { outfits = {}; }
  if (!outfits || typeof outfits !== "object" || Array.isArray(outfits)) outfits = {};
  Object.keys(outfits).forEach(function (id) {
    var o = outfits[id], ok = {};
    if (o && typeof o === "object" && B.some(function (b) { return b.id === id; })) SLOTS.forEach(function (s) { if (typeof o[s] === "string" && DRESS_HEX.hasOwnProperty(o[s])) ok[s] = o[s]; });
    if (Object.keys(ok).length) outfits[id] = ok; else delete outfits[id];
  });
  function saveOutfits() { try { localStorage.setItem(OUTFIT_KEY, JSON.stringify(outfits)); } catch (e) {} }
  // the breed with its outfit applied (same id, so the art's random marks stay identical)
  function dressed(b) {
    var o = outfits[b.id]; if (!o) return b;
    var look = {}, k; for (k in b.look) look[k] = b.look[k];
    SLOTS.forEach(function (s) { if (o[s]) look[s] = o[s] === "none" ? false : DRESS_HEX[o[s]]; });
    var d = {}; for (k in b) d[k] = b[k]; d.look = look; return d;
  }
  function buildDress() {
    SLOTS.forEach(function (slot) {
      var box = $("d" + slot);
      DRESS.forEach(function (c) {
        var sw = document.createElement("button");
        sw.type = "button"; sw.className = "sw" + (c[0] === "none" ? " none" : ""); sw.dataset.slot = slot; sw.dataset.v = c[0];
        sw.setAttribute("aria-pressed", "false"); sw.title = c[1] + " " + slot;
        sw.setAttribute("aria-label", c[1] + " " + slot);
        if (c[2]) sw.style.setProperty("--c", c[2]);
        sw.onclick = function () { var b = visible[current]; if (b) wear(b, slot, c[0]); };
        box.appendChild(sw);
      });
    });
  }
  function paintDress(b) {
    var o = outfits[b.id] || {};
    document.querySelectorAll("#dress .sw").forEach(function (sw) { sw.setAttribute("aria-pressed", o[sw.dataset.slot] === sw.dataset.v ? "true" : "false"); });
    $("dclassic").setAttribute("aria-pressed", outfits[b.id] ? "false" : "true");
    $("dsurprise").setAttribute("aria-label", "Surprise outfit for " + b.name + " (D)");
  }
  function outfitText(b) {
    var o = outfits[b.id];
    if (!o) return b.name + " is back in the classic look.";
    var bits = SLOTS.filter(function (s) { return o[s]; }).map(function (s) { return o[s] === "none" ? "no " + s : "a " + DRESS_NAME[o[s]].toLowerCase() + " " + s; });
    return b.name + " is wearing " + bits.join(" and ") + ".";
  }
  function redress(b) {
    ART[b.id] = DogArt.svg(dressed(b));
    var a = cardArt(b); if (a) a.innerHTML = ART[b.id];
    if ($("potd").dataset.id === b.id) $("potdart").innerHTML = DogArt.svg(dressed(b), { id: "potd-" + b.id, title: false });
    if (dlg.open && visible[current] === b) {
      $("dart").innerHTML = DogArt.svg(dressed(b), { id: "big-" + b.id });
      applyZ(false); // keep the current zoom
      paintDress(b);
      $("dresslive").textContent = outfitText(b);
      var z = $("dart"); z.classList.remove("petted", "dressing"); void z.offsetWidth; z.classList.add("dressing");
      hearts(SPARKLES); sfx("pop");
    }
  }
  function wear(b, slot, v) {
    var o = {}, k, cur = outfits[b.id] || {};
    for (k in cur) o[k] = cur[k];
    if (v == null || o[slot] === v) delete o[slot]; else o[slot] = v;
    if (Object.keys(o).length) outfits[b.id] = o; else delete outfits[b.id];
    saveOutfits(); redress(b);
  }
  function surprise() {
    var b = visible[current]; if (!b || !dlg.open) return;
    var cur = outfits[b.id] || {}, cols = DRESS.slice(1).map(function (c) { return c[0]; }), o;
    for (var t = 0; t < 20; t++) {
      o = { collar: cols[Math.floor(Math.random() * cols.length)], bow: cols[Math.floor(Math.random() * cols.length)] };
      if (o.collar !== cur.collar || o.bow !== cur.bow) break;
    }
    outfits[b.id] = o; saveOutfits(); redress(b);
  }
  function classic() { var b = visible[current]; if (!b || !dlg.open || !outfits[b.id]) return; delete outfits[b.id]; saveOutfits(); redress(b); }
  // ---------- ✏️ Nicknames: give each pup your own cute name (saved in localStorage) ----------
  var NICK_KEY = "puppyPals.names", NICK_MAX = 16, nicks = {};
  var NICK_IDEAS = ["Mochi", "Dango", "Boba", "Momo", "Yuzu", "Tofu", "Nori", "Sakura", "Kiki", "Pudding", "Biscuit", "Peanut", "Waffles", "Bean", "Pom Pom", "Cookie", "Maple", "Honey", "Taiyaki", "Udon", "Matcha", "Coco", "Sprinkles", "Marshmallow", "Noodle", "Onigiri", "Pickles", "Bubbles"];
  function cleanNick(v) { return typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, NICK_MAX).trim() : ""; }
  try { nicks = JSON.parse(localStorage.getItem(NICK_KEY) || "{}"); } catch (e) { nicks = {}; }
  if (!nicks || typeof nicks !== "object" || Array.isArray(nicks)) nicks = {};
  Object.keys(nicks).forEach(function (id) { var v = cleanNick(nicks[id]); if (v && B.some(function (b) { return b.id === id; })) nicks[id] = v; else delete nicks[id]; });
  function nickOf(id) { return nicks[id] || ""; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return "&#" + ch.charCodeAt(0) + ";"; }); }
  function nickTag(b) { var n = nickOf(b.id); return n ? '<span class="nk" title="Your nickname for ' + esc(b.name) + '">✏️ ' + esc(n) + "</span>" : ""; }
  function setNick(b, v, quiet) {
    var n = cleanNick(v), old = nickOf(b.id);
    if (n) nicks[b.id] = n; else delete nicks[b.id];
    try { localStorage.setItem(NICK_KEY, JSON.stringify(nicks)); } catch (e) {}
    b._hay = hay(b);
    var c = document.querySelector('.card[data-id="' + b.id + '"]');
    if (c) { var t = c.querySelector(".nk"); if (t) t.remove(); if (n) c.querySelector("h3").insertAdjacentHTML("beforebegin", nickTag(b)); }
    if (!quiet && n !== old) {
      if (n) { toast("💕 " + b.name + " is now called " + n + "!"); sfx("heart"); }
      else { toast(b.name + " doesn't have a nickname anymore."); sfx("unheart"); }
    }
    return n;
  }
  function suggestNick(b) {
    var cur = nickOf(b.id), pool = NICK_IDEAS.filter(function (x) { return x !== cur; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function paintNick(b) {
    var i = $("dnick"); i.value = nickOf(b.id);
    i.placeholder = "Name your " + b.name + "…";
    $("dnickdice").setAttribute("aria-label", "Suggest a cute name for " + b.name);
  }
  var SPARKLES = ["✨", "🎀", "⭐", "💖"];
  var visible = [], current = -1;

  // pre-render art once
  var ART = {}; B.forEach(function (b) { ART[b.id] = DogArt.svg(dressed(b)); });
  buildDress();
  $("total").textContent = B.length;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function hay(b) { return norm([b.name, b.origin, b.group, b.size, nickOf(b.id)].concat(b.traits).join(" ")); }
  B.forEach(function (b) { b._hay = hay(b); });

  function chip(label, value, kind, count, dot) {
    var el = document.createElement("button");
    el.className = "chip"; el.type = "button"; el.dataset.kind = kind; el.dataset.value = value;
    el.setAttribute("aria-pressed", "false");
    el.innerHTML = (dot ? '<span class="dot" style="background:var(--' + value + ')"></span>' : "") + label + '<span class="n">' + count + "</span>";
    return el;
  }
  SIZES.forEach(function (s) { $("sizes").appendChild(chip(cap(s), s, "sizes", B.filter(function (b) { return b.size === s; }).length, true)); });
  GROUPS.forEach(function (g) { $("groups").appendChild(chip(g, g, "groups", B.filter(function (b) { return b.group === g; }).length)); });

  document.querySelector(".controls").addEventListener("click", function (e) {
    if (e.target.closest("#favonly")) { state.fav = !state.fav; render(); sync(); return; }
    var c = e.target.closest(".chip"); if (!c) return;
    var arr = state[c.dataset.kind], i = arr.indexOf(c.dataset.value);
    if (i >= 0) arr.splice(i, 1); else arr.push(c.dataset.value);
    render(); sync();
  });
  var qt; $("q").addEventListener("input", function (e) { state.q = e.target.value; clearTimeout(qt); qt = setTimeout(function () { render(); sync(); }, 80); });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); sync(); });
  function reset() { state.q = ""; state.sizes = []; state.groups = []; state.fav = false; $("q").value = ""; render(); sync(); $("q").focus(); }
  $("reset").onclick = reset; $("reset2").onclick = reset;

  function filtered() {
    var terms = norm(state.q).split(/\s+/).filter(Boolean);
    var list = B.filter(function (b) {
      if (state.fav && !isFav(b.id)) return false;
      if (state.sizes.length && state.sizes.indexOf(b.size) < 0) return false;
      if (state.groups.length && state.groups.indexOf(b.group) < 0) return false;
      return terms.every(function (t) { return b._hay.indexOf(t) >= 0; });
    });
    var byName = function (a, b) { return a.name.localeCompare(b.name); };
    var sorters = {
      az: byName,
      small: function (a, b) { return SIZE_RANK[a.size] - SIZE_RANK[b.size] || byName(a, b); },
      big: function (a, b) { return SIZE_RANK[b.size] - SIZE_RANK[a.size] || byName(a, b); },
      group: function (a, b) { return a.group.localeCompare(b.group) || byName(a, b); }
    };
    return list.sort(sorters[state.sort] || byName);
  }

  function render() {
    visible = filtered();
    document.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", state[c.dataset.kind].indexOf(c.dataset.value) >= 0); });
    $("favonly").setAttribute("aria-pressed", state.fav); $("favn").textContent = favs.length;
    var g = $("grid"); g.innerHTML = "";
    var frag = document.createDocumentFragment();
    visible.forEach(function (b, i) {
      var cell = document.createElement("div");
      cell.className = "cell"; cell.style.animationDelay = Math.min(i * 18, 400) + "ms";
      var c = document.createElement("button");
      c.type = "button"; c.className = "card"; c.dataset.id = b.id;
      c.innerHTML = '<div class="art">' + ART[b.id] + "</div>" + nickTag(b) + "<h3>" + b.name + '</h3><div class="meta"><span class="sz ' + b.size + '">' + b.size + "</span><span>" + b.group + "</span></div>" + (isMet(b.id) ? STAMP : "");
      c.onclick = function () { openDlg(i); };
      var h = document.createElement("button");
      h.type = "button"; h.className = "fav"; h.dataset.id = b.id; h.innerHTML = HEART; paintFav(h, b);
      h.onclick = function () {
        toggleFav(b);
        if (state.fav && !isFav(b.id)) { render(); var next = document.querySelectorAll(".fav")[Math.min(i, visible.length - 1)]; (next || $("favonly")).focus(); }
      };
      cell.appendChild(c); cell.appendChild(h); frag.appendChild(cell);
    });
    g.appendChild(frag);
    var filteredOn = state.q || state.sizes.length || state.groups.length || state.fav;
    $("count").textContent = filteredOn ? "Showing " + visible.length + " of " + B.length + " breeds" : "All " + B.length + " breeds";
    $("reset").hidden = !filteredOn;
    $("empty").hidden = visible.length > 0;
    $("emptymsg").textContent = state.fav && !favs.length ? "No favorites yet. Tap the ♡ on a pup to save it!" : "No pups match that.";
  }

  // ---------- dialog + FLIP zoom ----------
  var dlg = $("dlg"), zoomEl = $("zoom"), busy = false;
  var reduced = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var EASE = "cubic-bezier(.2,.8,.2,1)";
  function cardArt(b) { var c = b && document.querySelector('.card[data-id="' + b.id + '"]'); return c ? c.querySelector(".art") : null; }
  function fill(b) {
    zReset(true);
    $("dart").innerHTML = DogArt.svg(dressed(b), { id: "big-" + b.id });
    $("dname").textContent = b.name; $("dorigin").textContent = "📍 " + b.origin;
    $("dtags").innerHTML = b.traits.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    $("dgroup").textContent = b.group; $("dsize").textContent = cap(b.size);
    paintFav($("dfav"), b); meet(b); paintPets(b); paintSnack(b); $("dtreatlive").textContent = ""; paintBath(b); $("dbathlive").textContent = ""; paintDress(b); paintNick(b); $("dresslive").textContent = ""; $("dart").classList.remove("petted", "dressing", "munch", "bathing");
    $("dweight").textContent = b.weight; $("dlife").textContent = b.life; $("dfact").textContent = b.fact;
    if (location.hash !== "#" + b.id) history.replaceState(null, "", qs() + "#" + b.id);
  }
  function inView(r) { return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  // fly a clone of the dog from rect `from` to rect `to` (FLIP: element sits at `to`, inverted transform starts it at `from`)
  function fly(b, from, to, dur) {
    var f = document.createElement("div");
    f.className = "fly"; f.setAttribute("aria-hidden", "true");
    f.style.cssText = "left:" + to.left + "px;top:" + to.top + "px;width:" + to.width + "px;height:" + to.height + "px";
    f.innerHTML = DogArt.svg(dressed(b), { id: "fly-" + b.id, title: false });
    dlg.appendChild(f); // inside the dialog so it renders in the top layer
    var inv = "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + "," + (from.height / to.height) + ")";
    var an = f.animate([{ transform: inv }, { transform: "none" }], { duration: dur, easing: EASE });
    return an.finished.then(function () { f.remove(); }, function () { f.remove(); });
  }
  function fade(el, from, to, dur, pseudo) {
    try { return el.animate({ opacity: [from, to] }, { duration: dur, easing: "ease", fill: "both", pseudoElement: pseudo }); } catch (e) { return null; }
  }
  function openDlg(i) {
    if (busy) return;
    current = i; var b = visible[i]; fill(b); sfx("bark", b);
    if (dlg.open) return;
    var src = cardArt(b), from = src && src.getBoundingClientRect();
    dlg.showModal();
    if (reduced.matches || !from || !inView(from)) return;
    busy = true;
    var target = zoomEl.getBoundingClientRect(), D = 420;
    zoomEl.style.visibility = "hidden"; src.style.visibility = "hidden";
    var anims = [fade(dlg.querySelector(".dbody"), 0, 1, D), fade(dlg.querySelector(".dart"), 0, 1, D * 0.8), fade(dlg, 0, 1, D * 0.8, "::backdrop"), fade(dlg.querySelector(".close"), 0, 1, D)];
    fly(b, from, target, D).then(function () {
      zoomEl.style.visibility = ""; src.style.visibility = "";
      anims.forEach(function (a) { if (a) a.cancel(); });
      busy = false;
    });
  }
  function closeDlg() {
    if (!dlg.open || busy) return;
    var b = visible[current], dst = cardArt(b);
    if (dst) dst.closest(".card").scrollIntoView({ block: "nearest" });
    var to = dst && dst.getBoundingClientRect();
    if (reduced.matches || !to || !inView(to)) { dlg.close(); return; }
    busy = true;
    var from = zoomEl.getBoundingClientRect(), D = 340;
    // shrink from the zoomed-out view
    zReset(true);
    zoomEl.style.visibility = "hidden"; dst.style.visibility = "hidden";
    var anims = [fade(dlg.querySelector(".dbody"), 1, 0, D * 0.6), fade(dlg.querySelector(".dart"), 1, 0, D * 0.6), fade(dlg, 1, 0, D, "::backdrop"), fade(dlg.querySelector(".close"), 1, 0, D * 0.5)];
    // the clone flies from the panel to the card, then the dialog closes
    var cl = document.createElement("div");
    cl.className = "fly"; cl.setAttribute("aria-hidden", "true");
    cl.style.cssText = "left:" + to.left + "px;top:" + to.top + "px;width:" + to.width + "px;height:" + to.height + "px";
    cl.innerHTML = DogArt.svg(dressed(b), { id: "fly-" + b.id, title: false });
    dlg.appendChild(cl);
    var inv = "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + "," + (from.height / to.height) + ")";
    cl.animate([{ transform: inv }, { transform: "none" }], { duration: D, easing: EASE, fill: "forwards" }).finished.then(done, done);
    function done() {
      dlg.close(); cl.remove();
      anims.forEach(function (a) { if (a) a.cancel(); });
      zoomEl.style.visibility = ""; dst.style.visibility = ""; busy = false;
    }
  }
  function step(d) { if (visible.length && !busy) openDlg((current + d + visible.length) % visible.length); }
  $("dprev").onclick = function () { step(-1); }; $("dnext").onclick = function () { step(1); };
  $("dclose").onclick = closeDlg;
  $("dpet").onclick = pet; $("dtreat").onclick = function () { treat(); }; $("dbath").onclick = bath;
  $("dart").addEventListener("animationend", function (e) { if (e.animationName === "petwiggle") $("dart").classList.remove("petted"); if (e.animationName === "dresspop") $("dart").classList.remove("dressing"); if (e.animationName === "munch") $("dart").classList.remove("munch"); if (e.animationName === "shakeoff") $("dart").classList.remove("bathing"); });
  $("dsurprise").onclick = surprise; $("dclassic").onclick = classic;
  // favoriting inside the dialog; if the favorites filter is on, re-render once the dialog closes
  $("dfav").onclick = function () { var b = visible[current]; if (!b) return; toggleFav(b); if (state.fav) pendingRender = true; };
  $("dnick").addEventListener("change", function () { var b = visible[current]; if (b) this.value = setNick(b, this.value); });
  $("dnickdice").onclick = function () { var b = visible[current]; if (!b) return; $("dnick").value = setNick(b, suggestNick(b)); hearts(["✏️", "💖", "✨"]); };
  $("nickform").addEventListener("submit", function (e) { e.preventDefault(); $("dnick").blur(); });
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDlg(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener("close", function () {
    history.replaceState(null, "", qs() || location.pathname);
    if (pendingRender) { pendingRender = false; var keep = (visible[current] || {}).id; render(); current = visible.findIndex(function (b) { return b.id === keep; }); if (current < 0) { $("favonly").focus(); return; } }
    var c = document.querySelector('.card[data-id="' + (visible[current] || {}).id + '"]'); if (c) c.focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.target && e.target.id === "dnick") { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } return; } // typing a nickname never triggers shortcuts
    if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); $("dnick").focus(); $("dnick").select(); return; }
    if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) { $("dfav").click(); return; }
    if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey) { pet(); return; }
    if ((e.key === "k" || e.key === "K") && !e.ctrlKey && !e.metaKey && !e.altKey) { treat(); return; }
    if ((e.key === "b" || e.key === "B") && !e.ctrlKey && !e.metaKey && !e.altKey) { bath(); return; }
    if ((e.key === "d" || e.key === "D") && !e.ctrlKey && !e.metaKey && !e.altKey) { surprise(); return; }
    if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && !e.altKey) { sticker(); return; }
    if ((e.key === "l" || e.key === "L") && !e.ctrlKey && !e.metaKey && !e.altKey) { share(); return; }
    if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1);
    else if (e.key === "+" || e.key === "=") zoomBy(1.5); else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.5); else if (e.key === "0") zReset();
  });

  // ---------- 📸 stickers: save the pup (in its outfit) as a cute PNG card (sticker.js) ----------
  var stickerBusy = false;
  function sticker() {
    var b = visible[current], btn = $("dsticker");
    if (!b || !dlg.open || stickerBusy || !window.PuppySticker) return;
    stickerBusy = true; btn.disabled = true; btn.textContent = "📸 Snap!";
    var z = $("zoom"); z.classList.remove("flash"); void z.offsetWidth; z.classList.add("flash");
    sfx("pop");
    PuppySticker.save(b).then(function (r) {
      if (r === "saved") toast("📸 " + b.name + " sticker saved!");
      else if (r === "shared") toast("💌 " + b.name + " sticker shared!");
      if (r !== "cancelled") { hearts(["✨", "📸", "💖"]); sfx("yay"); }
    }, function () { toast("😿 Couldn't make the sticker, please try again."); }).then(function () {
      stickerBusy = false; btn.disabled = false; btn.textContent = "📸 Sticker";
    });
  }
  $("dsticker").onclick = sticker;
  // ---------- 🔗 share a link that opens straight to this pup (clean URL: no filters, just #id) ----------
  function shareUrl(b) { return location.href.split("#")[0].split("?")[0] + "#" + b.id; }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) return navigator.clipboard.writeText(t).catch(function () { return legacyCopy(t); });
    return legacyCopy(t);
  }
  function legacyCopy(t) {
    return new Promise(function (ok, no) {
      var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      dlg.appendChild(ta); ta.select(); var done = false; try { done = document.execCommand("copy"); } catch (e) {} ta.remove();
      if (done) ok(); else no(new Error("copy failed"));
    });
  }
  var shareBusy = false;
  function share() {
    var b = visible[current], btn = $("dshare");
    if (!b || !dlg.open || shareBusy) return;
    var url = shareUrl(b), nick = nickOf(b.id);
    var text = (nick ? "Meet " + nick + " the " + b.name : "Meet the " + b.name) + " on Puppy Pals! 🐾";
    var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    shareBusy = true; btn.disabled = true;
    var p = (touch && navigator.share) ? navigator.share({ title: b.name + " · Puppy Pals", text: text, url: url }).then(function () { return "shared"; }, function (e) { if (e && e.name === "AbortError") return "cancelled"; return copyText(url).then(function () { return "copied"; }); })
      : copyText(url).then(function () { return "copied"; });
    p.then(function (r) {
      if (r === "copied") toast("🔗 Link to " + b.name + " copied!");
      else if (r === "shared") toast("💌 " + b.name + " shared!");
      if (r !== "cancelled") { hearts(["🔗", "💌", "💖"]); sfx("pop"); }
    }, function () { toast("😿 Couldn't copy the link: " + url); }).then(function () { shareBusy = false; btn.disabled = false; });
  }
  $("dshare").onclick = share;
  $("zoom").addEventListener("animationend", function (e) { if (e.animationName === "snapflash") $("zoom").classList.remove("flash"); });

  // ---------- in-dialog zoom/pan: edits the SVG viewBox so it stays vector-crisp ----------
  var Z = { x: 0, y: 0, w: 200 }, ZMAX = 6, PAD = 12;
  function svgEl() { return $("dart").querySelector("svg"); }
  function scale() { return 200 / Z.w; }
  function clampZ() {
    Z.w = Math.min(200, Math.max(200 / ZMAX, Z.w));
    if (Z.w >= 199.99) { Z.x = 0; Z.y = 0; Z.w = 200; return; }
    Z.x = Math.min(200 + PAD - Z.w, Math.max(-PAD, Z.x));
    Z.y = Math.min(200 + PAD - Z.w, Math.max(-PAD, Z.y));
  }
  function applyZ(animate) {
    clampZ();
    var s = svgEl(), vb = [Z.x, Z.y, Z.w, Z.w].map(function (v) { return Math.round(v * 100) / 100; }).join(" ");
    if (s) {
      if (animate && !reduced.matches) tweenVB(s, vb); else { cancelTween(); s.setAttribute("viewBox", vb); }
    }
    var sc = scale();
    $("zlvl").textContent = Math.round(sc * 100) + "%";
    $("zout").disabled = sc <= 1.001; $("zin").disabled = sc >= ZMAX - 0.001; $("zreset").disabled = sc <= 1.001;
    zoomEl.classList.toggle("zoomed", sc > 1.001);
  }
  var tw = 0;
  function cancelTween() { if (tw) cancelAnimationFrame(tw); tw = 0; }
  function tweenVB(s, vb) {
    cancelTween();
    var a = (s.getAttribute("viewBox") || "0 0 200 200").split(/\s+/).map(Number), b2 = vb.split(" ").map(Number), t0 = performance.now(), D = 220;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      s.setAttribute("viewBox", k < 1 ? a.map(function (v, i) { return (v + (b2[i] - v) * e).toFixed(2); }).join(" ") : vb);
      tw = k < 1 ? requestAnimationFrame(tick) : 0;
    })(t0);
  }
  // zoom by factor f keeping the point under (fx, fy) (0..1 within the box) fixed
  function zoomAt(f, fx, fy, animate) {
    var px = Z.x + fx * Z.w, py = Z.y + fy * Z.w;
    Z.w = Math.min(200, Math.max(200 / ZMAX, Z.w / f));
    Z.x = px - fx * Z.w; Z.y = py - fy * Z.w;
    applyZ(animate);
  }
  function zoomBy(f) { zoomAt(f, 0.5, 0.5, true); }
  function zReset(instant) { Z = { x: 0, y: 0, w: 200 }; applyZ(!instant); }
  function frac(e) { var r = zoomEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
  $("zin").onclick = function () { zoomBy(1.5); };
  $("zout").onclick = function () { zoomBy(1 / 1.5); };
  $("zreset").onclick = function () { zReset(); };
  zoomEl.addEventListener("wheel", function (e) {
    e.preventDefault();
    var p = frac(e), d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0025)), p[0], p[1], false);
  }, { passive: false });
  function toggleAt(p) { if (scale() > 1.001) zReset(); else zoomAt(2.5, p[0], p[1], true); }
  var lastTouch = 0;
  zoomEl.addEventListener("dblclick", function (e) { e.preventDefault(); if (performance.now() - lastTouch > 600) toggleAt(frac(e)); });

  // pointers: 1 = pan, 2 = pinch; touch double-tap toggles zoom
  var ptrs = {}, pinch = null, drag = null, lastTap = { t: 0, x: 0, y: 0 }, moved = false;
  function pts() { return Object.keys(ptrs).map(function (k) { return ptrs[k]; }); }
  zoomEl.addEventListener("pointerdown", function (e) {
    zoomEl.setPointerCapture(e.pointerId);
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
    if (e.pointerType !== "mouse") lastTouch = performance.now();
    moved = false; cancelTween();
    var p = pts();
    if (p.length === 2) {
      var r = zoomEl.getBoundingClientRect();
      pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, w: Z.w, mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2, x: Z.x, y: Z.y, r: r };
      drag = null;
    } else if (p.length === 1) { drag = { x: e.clientX, y: e.clientY, zx: Z.x, zy: Z.y }; }
  });
  zoomEl.addEventListener("pointermove", function (e) {
    if (!ptrs[e.pointerId]) return;
    ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY;
    var p = pts(), r = zoomEl.getBoundingClientRect();
    if (pinch && p.length >= 2) {
      moved = true;
      var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
      // world point under the initial midpoint stays under the current midpoint
      var fx0 = (pinch.mx - r.left) / r.width, fy0 = (pinch.my - r.top) / r.height;
      var wx = pinch.x + fx0 * pinch.w, wy = pinch.y + fy0 * pinch.w;
      Z.w = Math.min(200, Math.max(200 / ZMAX, pinch.w * pinch.d / d));
      Z.x = wx - ((mx - r.left) / r.width) * Z.w; Z.y = wy - ((my - r.top) / r.height) * Z.w;
      applyZ(false);
    } else if (drag && p.length === 1) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (scale() > 1.001 && moved) {
        zoomEl.classList.add("dragging");
        Z.x = drag.zx - dx * Z.w / r.width; Z.y = drag.zy - dy * Z.w / r.height; applyZ(false);
      }
    }
  });
  function up(e) {
    var info = ptrs[e.pointerId]; delete ptrs[e.pointerId];
    var p = pts();
    if (p.length < 2) pinch = null;
    if (p.length === 1) drag = { x: p[0].x, y: p[0].y, zx: Z.x, zy: Z.y }; else drag = null;
    zoomEl.classList.remove("dragging");
    if (e.type === "pointerup" && info && info.type !== "mouse" && !moved && p.length === 0) {
      var now = performance.now();
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { toggleAt(frac(e)); lastTap.t = 0; }
      else lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  }
  zoomEl.addEventListener("pointerup", up); zoomEl.addEventListener("pointercancel", up);
  applyZ(false);

  // URL state (?q=&size=&group=&sort=)
  function qs() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.sizes.length) p.set("size", state.sizes.join(","));
    if (state.groups.length) p.set("group", state.groups.join(","));
    if (state.sort !== "az") p.set("sort", state.sort);
    if (state.fav) p.set("fav", "1");
    var s = p.toString(); return s ? "?" + s : "";
  }
  function sync() { history.replaceState(null, "", (qs() || location.pathname) + (dlg.open ? location.hash : "")); }
  (function load() {
    var p = new URLSearchParams(location.search);
    state.q = p.get("q") || ""; $("q").value = state.q;
    state.sizes = (p.get("size") || "").split(",").filter(function (s) { return SIZES.indexOf(s) >= 0; });
    state.groups = (p.get("group") || "").split(",").filter(function (g) { return GROUPS.indexOf(g) >= 0; });
    state.sort = p.get("sort") || "az"; $("sort").value = state.sort;
    state.fav = p.get("fav") === "1";
  })();
  $("emptydog").innerHTML = DogArt.svg({ id: "empty-pug", name: "Confused pug", look: { ears: "rose", earColor: "#2d2424", head: "wide", muzzle: "short", muzzleColor: "#3a2f2f", tail: "curl", coat: { base: "#e9cfa1", light: "#f3e2c3" }, eyes: { size: 1.1, droopy: true }, wrinkles: true } });
  render();
  function openFromHash() { var id = decodeURIComponent(location.hash.slice(1)); if (id && B.some(function (b) { return b.id === id; })) openBreed(id); }
  openFromHash();
  window.addEventListener("hashchange", function () { if (!dlg.open) openFromHash(); });
  // ---------- Pup of the Day: the same pup for everyone on a given local date ----------
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function pupOfDay(key) {
    var h = 2166136261; // FNV-1a over the date string
    for (var k = 0; k < key.length; k++) { h ^= key.charCodeAt(k); h = Math.imul(h, 16777619) >>> 0; }
    return B[h % B.length];
  }
  function openBreed(id) {
    var i = visible.findIndex(function (b) { return b.id === id; });
    if (i < 0) { state.q = ""; state.sizes = []; state.groups = []; state.fav = false; $("q").value = ""; render(); sync(); i = visible.findIndex(function (b) { return b.id === id; }); }
    if (i >= 0) openDlg(i);
  }
  (function potd() {
    var key = dayKey(), b = pupOfDay(key);
    $("potdart").innerHTML = DogArt.svg(dressed(b), { id: "potd-" + b.id, title: false });
    $("potdname").textContent = b.name;
    $("potdinfo").textContent = "📍 " + b.origin + " · " + b.traits.join(", ");
    $("potddate").textContent = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    $("potd").dataset.id = b.id;
    $("potdbtn").setAttribute("aria-label", "Say hi to " + b.name + ", today's pup");
    $("potdbtn").onclick = function () { openBreed(b.id); };
    $("potdart").onclick = function () { openBreed(b.id); };
  })();
  // ---------- offline / installable app (service worker only runs over http(s), not file://) ----------
  var toastT;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); toastT = setTimeout(function () { t.hidden = true; }, 300); }, 3200);
  }
  window.addEventListener("offline", function () { document.body.classList.add("offline"); toast("📴 You're offline, but the pups are still here!"); });
  window.addEventListener("online", function () { document.body.classList.remove("offline"); toast("🌈 Back online!"); });
  if (navigator.onLine === false) document.body.classList.add("offline");
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    var firstInstall = !navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      var w = reg.installing; if (!w || !firstInstall) return;
      w.addEventListener("statechange", function () { if (w.state === "activated") toast("🐾 Puppy Pals now works offline!"); });
    }).catch(function () {});
  }
  paintPassport();
  $("meetbtn").onclick = meetRandom;
  window.PuppyPals = { pupOfDay: pupOfDay, dayKey: dayKey, openBreed: openBreed, toast: toast, met: function () { return met.slice(); }, milestoneMsg: milestoneMsg, pets: function (id) { return id ? petCount(id) : JSON.parse(JSON.stringify(pets)); }, outfits: function () { return JSON.parse(JSON.stringify(outfits)); }, dressed: dressed, nick: nickOf, snacks: function () { return JSON.parse(JSON.stringify(snacks)); }, favSnack: favSnack, snackIds: SNACK_IDS.slice(), treat: treat, baths: function (id) { return id ? bathCount(id) : JSON.parse(JSON.stringify(baths)); }, bath: bath, nickIdeas: NICK_IDEAS.slice(), cleanNick: cleanNick, shareUrl: shareUrl };
  document.addEventListener("keydown", function (e) { if (e.key === "/" && document.activeElement !== $("q") && !dlg.open) { e.preventDefault(); $("q").focus(); } });
})();
