/* ⚖️ Size up: pick two pups and see them side by side, drawn to scale by weight, with their stats.
   The last pair is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.compare", DEF = ["chihuahua", "pyrenees"];
  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function nums(s) { return (String(s).match(/\d+(\.\d+)?/g) || []).map(Number); }
  // "8–11 kg" -> 9.5, "about 3 kg" -> 3, "under 4 kg" -> 3
  function kg(b) { var n = nums(b.weight); if (!n.length) return 1; if (/under/i.test(b.weight)) return n[0] * 0.75; return n.length > 1 ? (n[0] + n[1]) / 2 : n[0]; }
  function yrs(b) { var n = nums(b.life); return n.length > 1 ? (n[0] + n[1]) / 2 : (n[0] || 0); }
  // body height grows with the cube root of weight; the heavier pup is drawn full height
  function scales(a, b) {
    var m = Math.max(kg(a), kg(b));
    return [a, b].map(function (x) { return Math.max(0.3, Math.round(Math.cbrt(kg(x) / m) * 100) / 100); });
  }
  function verdict(a, b) {
    if (a.id === b.id) return "It's " + a.name + " twice! Double the cuteness 💕";
    var ka = kg(a), kb = kg(b), big = ka >= kb ? a : b, small = big === a ? b : a;
    var r = Math.max(ka, kb) / Math.min(ka, kb);
    if (r < 1.15) return a.name + " and " + b.name + " weigh about the same. Perfect playmates! 🤝";
    var n = r < 2 ? Math.round(r * 10) / 10 : Math.round(r);
    return "A " + big.name + " weighs about " + n + "× as much as a " + small.name + "! " + (r >= 3 ? "That's like " + Math.round(r) + " " + small.name + "s on a seesaw 🎠" : "A cozy size difference 🐾");
  }
  function lifeLine(a, b) {
    if (a.id === b.id) return "";
    var ya = yrs(a), yb = yrs(b);
    if (Math.abs(ya - yb) < 1) return "Both usually live around " + Math.round((ya + yb) / 2) + " years.";
    var o = ya > yb ? a : b;
    return o.name + " usually lives a little longer (about " + Math.round(Math.max(ya, yb)) + " years) 🎂";
  }
  var dlg = $("compare"), pair = DEF.slice();
  function load() {
    try { var v = (localStorage.getItem(KEY) || "").split(","); if (v.length === 2 && byId(v[0]) && byId(v[1])) return v; } catch (e) {}
    return DEF.slice();
  }
  function save() { try { localStorage.setItem(KEY, pair.join(",")); } catch (e) {} }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b); }
  function fill(sel) {
    var s = B.slice().sort(function (x, y) { return x.name.localeCompare(y.name); });
    sel.innerHTML = s.map(function (b) { return '<option value="' + b.id + '">' + b.name + "</option>"; }).join("");
  }
  function bar(v, max, cls) { return '<span class="cbar ' + cls + '" aria-hidden="true"><i style="width:' + Math.max(6, Math.round(v / max * 100)) + '%"></i></span>'; }
  function render(pop) {
    var a = byId(pair[0]), b = byId(pair[1]), sc = scales(a, b);
    $("csel1").value = a.id; $("csel2").value = b.id;
    [a, b].forEach(function (x, i) {
      var box = $("cpup" + (i + 1));
      box.innerHTML = art(x); box.style.setProperty("--s", sc[i]); box.dataset.id = x.id;
      box.setAttribute("aria-label", "Meet " + x.name);
      if (pop) { box.classList.remove("cpop"); void box.offsetWidth; box.classList.add("cpop"); }
      $("cname" + (i + 1)).textContent = x.name;
    });
    $("cstage").setAttribute("aria-label", a.name + " next to " + b.name + ", drawn to scale by weight");
    var mk = Math.max(kg(a), kg(b)), my = Math.max(yrs(a), yrs(b));
    var rows = [
      ["Size", a.size, b.size],
      ["Weight", a.weight + bar(kg(a), mk, "w"), b.weight + bar(kg(b), mk, "w")],
      ["Lifespan", a.life + bar(yrs(a), my, "l"), b.life + bar(yrs(b), my, "l")],
      ["Group", a.group, b.group],
      ["From", a.origin, b.origin]
    ];
    $("ctable").innerHTML = rows.map(function (r) { return '<tr><td>' + r[1] + '</td><th scope="row">' + r[0] + '</th><td>' + r[2] + "</td></tr>"; }).join("");
    $("cverdict").textContent = verdict(a, b);
    $("clife").textContent = lifeLine(a, b);
    dlg.dataset.pair = pair.join(",");
  }
  function set(i, id, quiet) {
    if (!byId(id)) return; pair[i] = id; save(); render(true);
    if (!quiet && window.PuppySound) PuppySound.play("bark", byId(id));
  }
  function random() {
    var a, b, n = 0;
    do { a = B[Math.floor(Math.random() * B.length)]; b = B[Math.floor(Math.random() * B.length)]; n++; }
    while ((a.id === b.id || a.size === b.size || (a.id === pair[0] && b.id === pair[1])) && n < 50);
    pair = [a.id, b.id]; save(); render(true);
    if (window.PuppySound) PuppySound.play("pop");
  }
  function swap() { pair = [pair[1], pair[0]]; save(); render(true); if (window.PuppySound) PuppySound.play("pop"); }
  fill($("csel1")); fill($("csel2"));
  $("csel1").onchange = function () { set(0, this.value); };
  $("csel2").onchange = function () { set(1, this.value); };
  $("cswap").onclick = swap;
  $("crandom").onclick = random;
  $("comparebtn").onclick = function () { pair = load(); render(false); dlg.showModal(); $("crandom").focus({ preventScroll: true }); };
  $("cclose").onclick = function () { dlg.close(); };
  [1, 2].forEach(function (i) {
    $("cpup" + i).onclick = function () {
      var id = this.dataset.id; dlg.dataset.meeting = "1"; dlg.close(); delete dlg.dataset.meeting;
      if (window.PuppyPals) PuppyPals.openBreed(id);
    };
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (!dlg.dataset.meeting) $("comparebtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /SELECT|INPUT/.test(e.target.tagName)) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); random(); }
    else if (e.key === "x" || e.key === "X") { e.preventDefault(); swap(); }
  });
  window.PuppyCompare = { kg: kg, yrs: yrs, scales: scales, verdict: verdict, lifeLine: lifeLine, pair: function () { return pair.slice(); } };
})();
