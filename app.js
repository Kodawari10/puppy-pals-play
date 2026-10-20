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
  function hearts() {
    if (reduced.matches) return;
    var z = $("zoom"), old = z.querySelectorAll(".pheart");
    for (var k = 0; k < old.length - 9; k++) old[k].remove();
    for (var i = 0; i < 3; i++) {
      var h = document.createElement("span");
      h.className = "pheart"; h.setAttribute("aria-hidden", "true");
      h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
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
  var visible = [], current = -1;

  // pre-render art once
  var ART = {}; B.forEach(function (b) { ART[b.id] = DogArt.svg(b); });
  $("total").textContent = B.length;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function hay(b) { return norm([b.name, b.origin, b.group, b.size].concat(b.traits).join(" ")); }
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
      c.innerHTML = '<div class="art">' + ART[b.id] + "</div><h3>" + b.name + '</h3><div class="meta"><span class="sz ' + b.size + '">' + b.size + "</span><span>" + b.group + "</span></div>" + (isMet(b.id) ? STAMP : "");
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
    $("dart").innerHTML = DogArt.svg(b, { id: "big-" + b.id });
    $("dname").textContent = b.name; $("dorigin").textContent = "📍 " + b.origin;
    $("dtags").innerHTML = b.traits.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    $("dgroup").textContent = b.group; $("dsize").textContent = cap(b.size);
    paintFav($("dfav"), b); meet(b); paintPets(b); $("dart").classList.remove("petted");
    $("dweight").textContent = b.weight; $("dlife").textContent = b.life; $("dfact").textContent = b.fact;
    if (location.hash !== "#" + b.id) history.replaceState(null, "", qs() + "#" + b.id);
  }
  function inView(r) { return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
  // fly a clone of the dog from rect `from` to rect `to` (FLIP: element sits at `to`, inverted transform starts it at `from`)
  function fly(b, from, to, dur) {
    var f = document.createElement("div");
    f.className = "fly"; f.setAttribute("aria-hidden", "true");
    f.style.cssText = "left:" + to.left + "px;top:" + to.top + "px;width:" + to.width + "px;height:" + to.height + "px";
    f.innerHTML = DogArt.svg(b, { id: "fly-" + b.id, title: false });
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
    cl.innerHTML = DogArt.svg(b, { id: "fly-" + b.id, title: false });
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
  $("dpet").onclick = pet;
  $("dart").addEventListener("animationend", function (e) { if (e.animationName === "petwiggle") $("dart").classList.remove("petted"); });
  // favoriting inside the dialog; if the favorites filter is on, re-render once the dialog closes
  $("dfav").onclick = function () { var b = visible[current]; if (!b) return; toggleFav(b); if (state.fav) pendingRender = true; };
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDlg(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener("close", function () {
    history.replaceState(null, "", qs() || location.pathname);
    if (pendingRender) { pendingRender = false; var keep = (visible[current] || {}).id; render(); current = visible.findIndex(function (b) { return b.id === keep; }); if (current < 0) { $("favonly").focus(); return; } }
    var c = document.querySelector('.card[data-id="' + (visible[current] || {}).id + '"]'); if (c) c.focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey) { $("dfav").click(); return; }
    if ((e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey) { pet(); return; }
    if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1);
    else if (e.key === "+" || e.key === "=") zoomBy(1.5); else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.5); else if (e.key === "0") zReset();
  });

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
  if (location.hash) { var i = visible.findIndex(function (b) { return "#" + b.id === location.hash; }); if (i >= 0) openDlg(i); }
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
    $("potdart").innerHTML = DogArt.svg(b, { id: "potd-" + b.id, title: false });
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
  window.PuppyPals = { pupOfDay: pupOfDay, dayKey: dayKey, openBreed: openBreed, toast: toast, met: function () { return met.slice(); }, milestoneMsg: milestoneMsg, pets: function (id) { return id ? petCount(id) : JSON.parse(JSON.stringify(pets)); } };
  document.addEventListener("keydown", function (e) { if (e.key === "/" && document.activeElement !== $("q") && !dlg.open) { e.preventDefault(); $("q").focus(); } });
})();
