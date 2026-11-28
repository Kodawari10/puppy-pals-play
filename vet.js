/* 🩺 Pup Vet: five pups visit your little clinic, each with a small owie.
   Pick the right care (plaster, tissue, cool water…) to make them all better.
   Fewest wrong picks is your best visit. Saved in localStorage (puppyPals.vet). */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.vet", ROUND = 5;
  var CARE = [
    { id: "plaster", emoji: "🩹", name: "Plaster", owie: "has a sore paw", icon: "🐾", fix: "A plaster on the paw, and off they trot!", hint: "A sore paw needs something to cover it." },
    { id: "tissue", emoji: "🤧", name: "Tissue", owie: "has a sneezy nose", icon: "💦", fix: "A big blow into a tissue. Achoo, all gone!", hint: "Sneezes need something soft for the nose." },
    { id: "water", emoji: "💧", name: "Cool water", owie: "is too hot from playing", icon: "☀️", fix: "Slurp slurp! Cool water, and they feel fresh again.", hint: "Hot pups need a cool drink." },
    { id: "rice", emoji: "🍚", name: "Plain rice", owie: "has a rumbly tummy", icon: "🌀", fix: "A little bowl of plain rice settles that tummy.", hint: "A rumbly tummy likes plain, gentle food." },
    { id: "brush", emoji: "🪮", name: "Soft brush", owie: "has a tangly, itchy coat", icon: "🌿", fix: "Brush, brush, brush. No more tangles!", hint: "Tangles come out with a brush." },
    { id: "hug", emoji: "🧸", name: "Teddy hug", owie: "feels a bit lonely", icon: "💧", fix: "A teddy and a big hug. Lonely no more!", hint: "Lonely pups need something to cuddle." }
  ];
  var st = load(), dlg = $("vet"), queue = [], idx = 0, oops = 0, done = false, forced = null;

  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function careOf(id) { return CARE.filter(function (c) { return c.id === id; })[0] || null; }
  function nick(b) { return window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : ""; }
  function who(b) { var n = nick(b); return n ? n + " the " + b.name : b.name; }
  function load() {
    var raw; try { raw = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { raw = null; }
    var out = { helped: 0, visits: 0, best: null };
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      var h = Math.floor(Number(raw.helped)), v = Math.floor(Number(raw.visits)), b = Number(raw.best);
      if (h > 0 && h < 1e6) out.helped = h;
      if (v > 0 && v < 1e6) out.visits = v;
      if (raw.best !== null && Number.isInteger(b) && b >= 0 && b < 100) out.best = b;
    }
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function label() {
    var el = $("vetbest"); if (!el) return;
    el.textContent = st.visits ? "🩺 " + st.helped + " helped" + (st.best === 0 ? " · ⭐ perfect" : st.best !== null ? " · best " + st.best + " oops" : "") : "";
  }
  function rnd(n) { return forced ? forced(n) : Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // five different pups, five owies (no owie twice in a row)
  function makeQueue() {
    var pups = shuffle(B.map(function (b) { return b.id; })).slice(0, ROUND), q = [], last = "";
    pups.forEach(function (id) {
      var opts = CARE.filter(function (c) { return c.id !== last; }), c = opts[rnd(opts.length)];
      q.push({ pup: id, care: c.id }); last = c.id;
    });
    return q;
  }
  function art(b) {
    var d = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b;
    return DogArt.svg(d, { id: "vet-" + idx + "-" + b.id, title: false });
  }
  function say(msg) { $("vlive").textContent = msg; }
  function setNote(msg, cls) { var n = $("vnote"); n.textContent = msg; n.className = "vnote" + (cls ? " " + cls : ""); say(msg); }
  function hearts() {
    var s = ""; for (var i = 0; i < ROUND; i++) s += i < idx ? "💖" : i === idx && !done ? "🩺" : "🤍";
    $("vprog").textContent = s;
  }
  function paintPatient() {
    var p = queue[idx], b = byId(p.pup), c = careOf(p.care);
    $("vpatient").innerHTML = '<span class="vart" aria-hidden="true">' + art(b) + '</span><span class="vowie" aria-hidden="true">' + c.icon + "</span>";
    $("vpatient").classList.remove("vbetter");
    setNote(who(b) + " " + c.owie + ". What will help?");
    $("vtools").hidden = false; $("vagain").hidden = true;
    $("vtools").querySelectorAll(".vtool").forEach(function (t) { t.disabled = false; t.classList.remove("vno"); });
    hearts();
  }
  function begin() {
    queue = makeQueue(); idx = 0; oops = 0; done = false;
    paintPatient();
  }
  function finish() {
    done = true;
    st.helped += ROUND; st.visits += 1;
    var newBest = st.best === null || oops < st.best;
    if (newBest) st.best = oops;
    save(); label(); hearts();
    $("vpatient").innerHTML = '<span class="vparty" aria-hidden="true">' + queue.map(function (q) { return '<span class="vmini">' + DogArt.svg(byId(q.pup), { id: "vet-end-" + q.pup, title: false }) + "</span>"; }).join("") + "</span>";
    $("vtools").hidden = true; $("vagain").hidden = false;
    var msg = "All better! You helped " + ROUND + " pups" + (oops ? " with " + oops + " oops." : " with zero oops. Super vet! ⭐");
    if (newBest && st.visits > 1) msg += " New best!";
    setNote(msg, "vyay");
    if (window.PuppySound) PuppySound.play("fanfare");
    if (window.PuppyPals && PuppyPals.toast) PuppyPals.toast("🩺 Clinic closed: " + ROUND + " happy pups!");
    $("vagain").focus({ preventScroll: true });
  }
  function pick(id) {
    if (done || !queue.length) return;
    var p = queue[idx], b = byId(p.pup), c = careOf(p.care), btn = $("vtools").querySelector('.vtool[data-id="' + id + '"]');
    if (!careOf(id) || (btn && btn.disabled)) return;
    if (id !== p.care) {
      oops++;
      if (btn) { btn.disabled = true; btn.classList.add("vno"); }
      var nf = $("vtools").querySelector(".vtool:not(:disabled)"); if (nf) nf.focus({ preventScroll: true });
      setNote("Hmm, not the " + careOf(id).name.toLowerCase() + ". " + c.hint, "voops");
      if (window.PuppySound) PuppySound.play("oops");
      return;
    }
    $("vpatient").classList.add("vbetter");
    $("vpatient").querySelector(".vowie").textContent = "💖";
    $("vtools").querySelectorAll(".vtool").forEach(function (t) { t.disabled = true; });
    setNote(c.fix + " Thank you, vet!", "vyay");
    if (window.PuppySound) PuppySound.play("bark", b);
    idx++;
    setTimeout(function () {
      if (!dlg.open) return;
      if (idx >= ROUND) finish(); else { paintPatient(); var f = $("vtools").querySelector(".vtool"); if (f) f.focus({ preventScroll: true }); }
    }, window.PuppyVetFast ? 0 : 1100);
  }

  $("vtools").innerHTML = CARE.map(function (c, i) {
    return '<button type="button" class="vtool" data-id="' + c.id + '"><span class="vk" aria-hidden="true">' + (i + 1) + '</span><span class="ve" aria-hidden="true">' + c.emoji + "</span><span>" + c.name + "</span></button>";
  }).join("");
  $("vtools").addEventListener("click", function (e) { var t = e.target.closest(".vtool"); if (t) pick(t.dataset.id); });
  $("vetbtn").onclick = function () { st = load(); begin(); dlg.showModal(); var f = $("vtools").querySelector(".vtool"); if (f) f.focus({ preventScroll: true }); };
  $("vagain").onclick = function () { begin(); var f = $("vtools").querySelector(".vtool"); if (f) f.focus({ preventScroll: true }); };
  $("vclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { $("vetbtn").focus({ preventScroll: true }); });
  document.addEventListener("keydown", function (e) {
    if (!dlg.open || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = Number(e.key);
    if (n >= 1 && n <= CARE.length) { e.preventDefault(); pick(CARE[n - 1].id); }
  });
  label();
  window.PuppyVet = {
    care: function () { return CARE.map(function (c) { return c.id; }); },
    current: function () { return done || !queue.length ? null : { pup: queue[idx].pup, care: queue[idx].care, n: idx }; },
    pick: pick, get: function () { return JSON.parse(JSON.stringify(st)); },
    setRandom: function (fn) { forced = typeof fn === "function" ? fn : null; }, round: ROUND
  };
})();
