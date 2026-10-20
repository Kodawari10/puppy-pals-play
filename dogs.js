/* Parametric kawaii dog generator.
   DogArt.svg(breed, {id}) -> SVG markup string.
   A breed's `look` object picks shared parts (ears, muzzle, tail, coat
   markings, fluff, pose) and colours; anything omitted falls back to DEFAULTS. */
(function (root) {
  "use strict";
  var OUT = "#4a3434";
  var DEFAULTS = {
    pose: "sit",            // sit | long (long-bodied breeds)
    head: "round",          // round | wide | long | apple
    headScale: 1, build: 1, // head size, body width
    ears: "floppy", earSize: 1, earColor: null, earFeather: false,
    muzzle: "medium",       // short | medium | long
    muzzleColor: null,
    tail: "curl", tailColor: null, tailTip: null,
    fluff: 0,               // 0 none, 1 ruff, 2 fluffy, 3 cotton ball
    coat: { base: "#d9a066", body: null, light: "#fff6ea", second: "#5a3d2b", tan: "#c27a3a" },
    marks: [],              // see MARKS below
    eyes: { size: 1, color: "#2b1d1d", droopy: false, brows: false },
    nose: "#3a2a2a", tongue: false, smile: false, wrinkles: false, jowls: false,
    beard: false, tooth: false, silky: null, topknot: null, bow: null,
    collar: "#ff7aa8", barrel: false, blush: "#ff9db5"
  };

  // ---------- helpers ----------
  function merge(a, b) {
    var o = {}, k;
    for (k in a) o[k] = a[k];
    for (k in b) {
      if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") o[k] = merge(a[k], b[k]);
      else o[k] = b[k];
    }
    return o;
  }
  function shade(hex, amt) { // amt -1..1 (negative = darker)
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt); }
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  function rng(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function n(v) { return Math.round(v * 10) / 10; }
  function el(tag, attrs, inner) {
    var s = "<" + tag;
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) s += " " + k + '="' + attrs[k] + '"';
    return inner === undefined ? s + "/>" : s + ">" + inner + "</" + tag + ">";
  }
  function ell(cx, cy, rx, ry, fill, extra) {
    var a = { cx: n(cx), cy: n(cy), rx: n(rx), ry: n(ry), fill: fill };
    for (var k in extra || {}) a[k] = extra[k];
    return el("ellipse", a);
  }
  function outl(w) { return { stroke: OUT, "stroke-width": w || 2.4, "stroke-linejoin": "round" }; }
  // ellipse with scalloped (fluffy) edge
  function scallop(cx, cy, rx, ry, count, amp, start) {
    var d = "", pts = [];
    start = start || 0;
    for (var i = 0; i <= count; i++) {
      var a = start + (i / count) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a]);
    }
    d = "M" + n(pts[0][0]) + " " + n(pts[0][1]);
    for (i = 1; i < pts.length; i++) {
      var am = (pts[i - 1][2] + pts[i][2]) / 2;
      var qx = cx + Math.cos(am) * (rx + amp), qy = cy + Math.sin(am) * (ry + amp);
      d += " Q" + n(qx) + " " + n(qy) + " " + n(pts[i][0]) + " " + n(pts[i][1]);
    }
    return d + "Z";
  }
  var MX = 100; // mirror axis (set to head centre per drawing)
  function mirror(inner) { return el("g", { transform: "translate(" + (2 * MX) + " 0) scale(-1 1)" }, inner); }
  function both(inner) { return inner + mirror(inner); }
  function lum(hex) { var v = parseInt(hex.slice(1), 16); return (0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255; }
  function strokeTail(d, w, color, extra) {
    return el("path", { d: d, fill: "none", stroke: OUT, "stroke-width": w + 4.8, "stroke-linecap": "round" }) +
      el("path", { d: d, fill: "none", stroke: color, "stroke-width": w, "stroke-linecap": "round" }) + (extra || "");
  }

  // ---------- parts ----------
  function headGeom(L) {
    var s = L.headScale, H = { hw: 50 * s, hh: 44 * s };
    if (L.head === "wide") { H.hw *= 1.12; H.hh *= 0.94; }
    if (L.head === "long") { H.hw *= 0.9; H.hh *= 1.08; }
    if (L.head === "apple") { H.hw *= 1.02; H.hh *= 1.02; }
    if (L.pose === "long") { H.hx = 70; H.hy = 102; } else { H.hx = 100; H.hy = 84 + (1 - s) * 30; }
    return H;
  }
  function headPath(L, H) {
    var hx = H.hx, hy = H.hy, hw = H.hw, hh = H.hh;
    if (L.fluff >= 2) return scallop(hx, hy, hw, hh, L.fluff >= 3 ? 16 : 14, L.fluff >= 3 ? 7 : 5.5, -Math.PI / 2);
    if (L.head === "apple") // domed skull, narrower jaw
      return "M" + n(hx - hw) + " " + n(hy) + " C" + n(hx - hw) + " " + n(hy - hh * 1.35) + " " + n(hx + hw) + " " + n(hy - hh * 1.35) + " " + n(hx + hw) + " " + n(hy) +
        " C" + n(hx + hw) + " " + n(hy + hh * 0.85) + " " + n(hx + hw * 0.45) + " " + n(hy + hh) + " " + n(hx) + " " + n(hy + hh) +
        " C" + n(hx - hw * 0.45) + " " + n(hy + hh) + " " + n(hx - hw) + " " + n(hy + hh * 0.85) + " " + n(hx - hw) + " " + n(hy) + "Z";
    // soft rounded-square-ish head
    var k = L.head === "wide" ? 0.62 : 0.56;
    return "M" + n(hx) + " " + n(hy - hh) +
      " C" + n(hx + hw * k) + " " + n(hy - hh) + " " + n(hx + hw) + " " + n(hy - hh * k) + " " + n(hx + hw) + " " + n(hy) +
      " C" + n(hx + hw) + " " + n(hy + hh * k) + " " + n(hx + hw * k) + " " + n(hy + hh) + " " + n(hx) + " " + n(hy + hh) +
      " C" + n(hx - hw * k) + " " + n(hy + hh) + " " + n(hx - hw) + " " + n(hy + hh * k) + " " + n(hx - hw) + " " + n(hy) +
      " C" + n(hx - hw) + " " + n(hy - hh * k) + " " + n(hx - hw * k) + " " + n(hy - hh) + " " + n(hx) + " " + n(hy - hh) + "Z";
  }

  // Ears are drawn for the left side, then mirrored around the head centre.
  function earsBack(L, H, C) {
    var t = L.ears, s = L.earSize, hx = H.hx, hy = H.hy, hw = H.hw, hh = H.hh, ec = L.earColor || C.head;
    var inner = shade("#ffb3c6", 0), d, di;
    function pointy(spread, lift, width, round) {
      var bx1 = hx - hw * (0.92 - 0.1 * width), by1 = hy - hh * 0.3;
      var bx2 = hx - hw * (0.22 - 0.08 * width), by2 = hy - hh * 0.92;
      var tx = hx - hw * (0.78 + spread) * (0.75 + 0.25 * s), ty = hy - hh * (0.95 + 0.55 * lift * s);
      var r = round || 0;
      d = "M" + n(bx1) + " " + n(by1) + " Q" + n(tx - r) + " " + n(ty + r * 2) + " " + n(tx) + " " + n(ty) + " Q" + n(tx + r * 1.4) + " " + n(ty + r * 0.4) + " " + n(bx2) + " " + n(by2) + "Z";
      var ix = tx + (hx - tx) * 0.22, iy = ty + (hy - ty) * 0.3;
      di = "M" + n(bx1 + (tx - bx1) * 0.15 + 6) + " " + n(by1 - 4) + " Q" + n(ix - r * 0.5) + " " + n(iy + r) + " " + n(ix) + " " + n(iy) + " Q" + n(ix + r * 0.6) + " " + n(iy) + " " + n(bx2 - 3) + " " + n(by2 + 6) + "Z";
      return el("path", merge({ d: d, fill: ec }, outl())) + el("path", { d: di, fill: inner, opacity: 0.85 });
    }
    if (t === "pointy") return both(pointy(0.05, 1, 1, 4));
    if (t === "huge") return both(pointy(0.55, 0.75, 1.6, 6));
    if (t === "bat") return both(pointy(0.12, 0.8, 1.7, 14));
    if (t === "tiny") return both(pointy(0.05, 0.55, 0.7, 2));
    if (t === "butterfly") {
      var bx = hx - hw * 0.45, by = hy - hh * 0.75;
      d = "M" + n(bx + 6) + " " + n(by + 8) + " C" + n(bx - 30) + " " + n(by - 40) + " " + n(bx - 58) + " " + n(by - 34) + " " + n(bx - 52) + " " + n(by + 2) +
        " C" + n(bx - 48) + " " + n(by + 18) + " " + n(bx - 28) + " " + n(by + 24) + " " + n(bx - 14) + " " + n(by + 26) + "Z";
      var fr = "";
      for (var i = 0; i < 5; i++) { var fx = bx - 54 + i * 3, fy = by - 30 + i * 12; fr += el("path", { d: "M" + n(fx + 6) + " " + n(fy + 2) + " q-10 2 -14 8", stroke: shade(ec, -0.2), "stroke-width": 2.2, fill: "none", "stroke-linecap": "round" }); }
      di = "M" + n(bx) + " " + n(by + 8) + " C" + n(bx - 24) + " " + n(by - 26) + " " + n(bx - 44) + " " + n(by - 22) + " " + n(bx - 42) + " " + n(by + 2) + " C" + n(bx - 38) + " " + n(by + 14) + " " + n(bx - 22) + " " + n(by + 18) + " " + n(bx - 10) + " " + n(by + 18) + "Z";
      return both(el("path", merge({ d: d, fill: ec }, outl())) + el("path", { d: di, fill: inner, opacity: 0.6 }) + fr);
    }
    return "";
  }
  function earsFront(L, H, C) {
    var t = L.ears, s = L.earSize, hx = H.hx, hy = H.hy, hw = H.hw, hh = H.hh, ec = L.earColor || C.head, d;
    if (t === "floppy" || t === "long") {
      var len = (t === "long" ? 1.45 : 0.85) * s, wid = (t === "long" ? 1.25 : 1) * s;
      var x0 = hx - hw * 0.62, y0 = hy - hh * 0.86, x1 = hx - hw * 0.34, y1 = hy - hh * 0.62;
      var tipx = hx - hw * (0.98 + 0.05 * wid), tipy = hy + hh * (0.05 + 0.6 * len);
      d = "M" + n(x0) + " " + n(y0) + " C" + n(hx - hw * (1.2 + 0.2 * wid)) + " " + n(y0 - 4) + " " + n(hx - hw * (1.32 + 0.12 * wid)) + " " + n(tipy - hh * 0.2) + " " + n(tipx) + " " + n(tipy) +
        " C" + n(tipx + hw * 0.24 * wid) + " " + n(tipy + 4) + " " + n(hx - hw * (0.6 - 0.05 * wid)) + " " + n(hy + hh * 0.05) + " " + n(x1) + " " + n(y1) + "Z";
      var out = el("path", merge({ d: d, fill: ec }, outl()));
      if (L.earFeather) {
        for (var i = 0; i < 4; i++) {
          var fy = hy + hh * (0.0 + i * 0.18 * len), fx = hx - hw * (1.12 + 0.06 * wid) + i * 1.5;
          out += el("path", { d: "M" + n(fx + 6) + " " + n(fy) + " q-4 6 -1 12", stroke: shade(ec, -0.22), "stroke-width": 2, fill: "none", "stroke-linecap": "round" });
        }
      }
      return both(out);
    }
    if (t === "fold") { // button / semi-erect ears with tipped flap
      var bx = hx - hw * 0.8, by = hy - hh * 0.62;
      d = "M" + n(bx - 6 * s) + " " + n(by + 4) + " Q" + n(bx - 4) + " " + n(by - 22 * s) + " " + n(bx + 16 * s) + " " + n(by - 20 * s) +
        " Q" + n(bx + 30 * s) + " " + n(by - 14 * s) + " " + n(bx + 26 * s) + " " + n(by - 4 * s) + " Q" + n(bx + 10 * s) + " " + n(by + 14 * s) + " " + n(bx - 6 * s) + " " + n(by + 4) + "Z";
      return both(el("path", merge({ d: d, fill: ec }, outl())) + el("path", { d: "M" + n(bx - 2) + " " + n(by - 6 * s) + " Q" + n(bx + 10 * s) + " " + n(by - 14 * s) + " " + n(bx + 24 * s) + " " + n(by - 8 * s), stroke: shade(ec, -0.25), "stroke-width": 1.8, fill: "none", "stroke-linecap": "round" }));
    }
    if (t === "rose") {
      var rx = hx - hw * 0.82, ry = hy - hh * 0.66;
      d = "M" + n(rx - 2) + " " + n(ry + 10) + " Q" + n(rx - 14 * s) + " " + n(ry - 10 * s) + " " + n(rx + 4) + " " + n(ry - 14 * s) + " Q" + n(rx + 20 * s) + " " + n(ry - 12 * s) + " " + n(rx + 18 * s) + " " + n(ry - 2) + " Q" + n(rx + 6) + " " + n(ry + 2) + " " + n(rx - 2) + " " + n(ry + 10) + "Z";
      return both(el("path", merge({ d: d, fill: ec }, outl(2))));
    }
    if (t === "poodle") {
      var px = hx - hw * 0.98, py = hy + hh * 0.15, pc = ec, out2 = "";
      [[0, -14, 13], [-4, 2, 14], [2, 18, 13], [-2, 33, 11]].forEach(function (b) { out2 += el("circle", merge({ cx: n(px + b[0]), cy: n(py + b[1]), r: b[2], fill: pc }, outl(2))); });
      [[0, -14, 13], [-4, 2, 14], [2, 18, 13], [-2, 33, 11]].forEach(function (b) { out2 += el("circle", { cx: n(px + b[0]), cy: n(py + b[1]), r: b[2] - 1.4, fill: pc }); });
      return both(out2);
    }
    return "";
  }

  function tail(L, B, C) {
    var t = L.tail, col = L.tailColor || C.body, x = B.tx, y = B.ty, out = "";
    if (t === "none" || t === "stub") return t === "stub" ? el("ellipse", merge({ cx: n(x + 2), cy: n(y - 4), rx: 6, ry: 5, fill: col }, outl())) : "";
    if (t === "curl") {
      var fat = L.fluff >= 1 ? 15 : 10;
      out = strokeTail("M" + x + " " + y + " C" + (x + 26) + " " + (y - 6) + " " + (x + 30) + " " + (y - 40) + " " + (x + 10) + " " + (y - 42) + " C" + (x - 4) + " " + (y - 43) + " " + (x - 4) + " " + (y - 28) + " " + (x + 6) + " " + (y - 26), fat, col);
      if (L.tailTip) out += el("circle", { cx: x + 10, cy: y - 34, r: fat * 0.42, fill: L.tailTip });
      return out;
    }
    if (t === "plume") {
      var d = "M" + x + " " + y + " C" + (x + 30) + " " + (y - 4) + " " + (x + 34) + " " + (y - 30) + " " + (x + 26) + " " + (y - 52);
      out = strokeTail(d, 15, col);
      out += el("path", { d: "M" + (x + 20) + " " + (y - 30) + " q8 -6 6 -18", stroke: shade(col, -0.2), "stroke-width": 2, fill: "none", "stroke-linecap": "round" });
      if (L.tailTip) out += el("circle", { cx: x + 26, cy: y - 50, r: 6.5, fill: L.tailTip });
      return out;
    }
    if (t === "otter") return strokeTail("M" + x + " " + y + " C" + (x + 24) + " " + (y - 2) + " " + (x + 34) + " " + (y - 16) + " " + (x + 38) + " " + (y - 38), 11, col);
    if (t === "whip") return strokeTail("M" + x + " " + y + " C" + (x + 22) + " " + (y + 2) + " " + (x + 36) + " " + (y - 14) + " " + (x + 40) + " " + (y - 40), 6.5, col);
    if (t === "flag") {
      out = strokeTail("M" + x + " " + y + " C" + (x + 16) + " " + (y - 2) + " " + (x + 24) + " " + (y - 20) + " " + (x + 24) + " " + (y - 44), 9, col);
      return out + el("path", { d: "M" + (x + 24) + " " + (y - 36) + " L" + (x + 24) + " " + (y - 44), stroke: L.tailTip || C.light, "stroke-width": 9, "stroke-linecap": "round" });
    }
    if (t === "pom") {
      out = strokeTail("M" + x + " " + y + " C" + (x + 14) + " " + (y - 4) + " " + (x + 20) + " " + (y - 18) + " " + (x + 22) + " " + (y - 32), 6, col);
      return out + el("path", merge({ d: scallop(x + 23, y - 40, 11, 11, 9, 3), fill: col }, outl(2.2)));
    }
    return "";
  }

  // ---------- coat markings (clipped to head or body) ----------
  function headMarks(L, H, C, R) {
    var hx = H.hx, hy = H.hy, hw = H.hw, hh = H.hh, m = L.marks, out = "";
    function has(k) { return m.indexOf(k) >= 0; }
    if (has("cap")) out += ell(hx, hy - hh * 0.9, hw * 1.1, hh * 0.75, C.second);
    if (has("urajiro")) {
      out += ell(hx - hw * 0.5, hy + hh * 0.45, hw * 0.48, hh * 0.4, C.light) + ell(hx + hw * 0.5, hy + hh * 0.45, hw * 0.48, hh * 0.4, C.light);
      out += ell(hx - hw * 0.36, hy - hh * 0.28, 4.5, 3.5, C.light) + ell(hx + hw * 0.36, hy - hh * 0.28, 4.5, 3.5, C.light);
    }
    if (has("huskyMask")) { // white lower face, peak up the forehead, white brows
      out += el("path", { d: "M" + n(hx - hw * 1.1) + " " + n(hy - hh * 0.05) + " Q" + n(hx - hw * 0.55) + " " + n(hy - hh * 0.35) + " " + n(hx - hw * 0.12) + " " + n(hy - hh * 0.2) + " L" + n(hx) + " " + n(hy - hh * 0.75) + " L" + n(hx + hw * 0.12) + " " + n(hy - hh * 0.2) + " Q" + n(hx + hw * 0.55) + " " + n(hy - hh * 0.35) + " " + n(hx + hw * 1.1) + " " + n(hy - hh * 0.05) + " L" + n(hx + hw * 1.1) + " " + n(hy + hh * 1.2) + " L" + n(hx - hw * 1.1) + " " + n(hy + hh * 1.2) + "Z", fill: C.light });
      out += ell(hx - hw * 0.38, hy - hh * 0.3, 6, 4, C.light) + ell(hx + hw * 0.38, hy - hh * 0.3, 6, 4, C.light);
      // dark goggles around eyes
      out += ell(hx - hw * 0.38, hy + hh * 0.06, hw * 0.2, hh * 0.18, C.base, { transform: "rotate(-20 " + n(hx - hw * 0.38) + " " + n(hy) + ")" }) + ell(hx + hw * 0.38, hy + hh * 0.06, hw * 0.2, hh * 0.18, C.base, { transform: "rotate(20 " + n(hx + hw * 0.38) + " " + n(hy) + ")" });
    }
    if (has("tanPoints")) {
      out += ell(hx - hw * 0.36, hy - hh * 0.3, 5.5, 4, C.tan) + ell(hx + hw * 0.36, hy - hh * 0.3, 5.5, 4, C.tan);
      out += ell(hx - hw * 0.42, hy + hh * 0.52, hw * 0.34, hh * 0.32, C.tan) + ell(hx + hw * 0.42, hy + hh * 0.52, hw * 0.34, hh * 0.32, C.tan);
    }
    if (has("lowerLight")) out += ell(hx, hy + hh * 0.75, hw * 1.0, hh * 0.55, C.light);
    if (has("darkEars")) out += ell(hx - hw * 0.95, hy - hh * 0.4, hw * 0.42, hh * 0.6, C.second) + ell(hx + hw * 0.95, hy - hh * 0.4, hw * 0.42, hh * 0.6, C.second);
    if (has("eyeMasks")) out += ell(hx - hw * 0.4, hy + hh * 0.02, hw * 0.3, hh * 0.32, C.second) + ell(hx + hw * 0.4, hy + hh * 0.02, hw * 0.3, hh * 0.32, C.second);
    if (has("patchL")) out += ell(hx - hw * 0.55, hy - hh * 0.25, hw * 0.48, hh * 0.55, C.second);
    if (has("patchR")) out += ell(hx + hw * 0.55, hy - hh * 0.25, hw * 0.48, hh * 0.55, C.second);
    if (has("sideFace")) out += ell(hx - hw * 0.85, hy - hh * 0.1, hw * 0.55, hh * 0.85, C.second) + ell(hx + hw * 0.85, hy - hh * 0.1, hw * 0.55, hh * 0.85, C.second);
    if (has("blaze")) {
      var w = has("wideBlaze") ? 0.3 : 0.13;
      out += el("path", { d: "M" + n(hx - hw * w * 0.6) + " " + n(hy - hh * 1.05) + " L" + n(hx + hw * w * 0.6) + " " + n(hy - hh * 1.05) + " L" + n(hx + hw * w) + " " + n(hy - hh * 0.05) + " Q" + n(hx + hw * 0.6) + " " + n(hy + hh * 0.3) + " " + n(hx + hw * 0.6) + " " + n(hy + hh * 1.1) + " L" + n(hx - hw * 0.6) + " " + n(hy + hh * 1.1) + " Q" + n(hx - hw * 0.6) + " " + n(hy + hh * 0.3) + " " + n(hx - hw * w) + " " + n(hy - hh * 0.05) + "Z", fill: C.light });
    }
    if (has("spots") || has("merle")) out += speckle(R, hx, hy, hw, hh, C.second, has("merle"), has("merle") ? 7 : 12);
    return out;
  }
  function speckle(R, cx, cy, w, h, col, big, count) {
    var out = "";
    for (var i = 0; i < count; i++) {
      var a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.95;
      var x = cx + Math.cos(a) * w * d, y = cy + Math.sin(a) * h * d, r = big ? 5 + R() * 8 : 2.6 + R() * 3.2;
      if (big) out += el("path", { d: scallop(x, y, r, r * (0.6 + R() * 0.5), 5, r * 0.25, R() * 3), fill: col, opacity: 0.9 });
      else out += ell(x, y, r, r * 0.9, col);
    }
    return out;
  }
  function bodyMarks(L, B, C, R) {
    var m = L.marks, out = "", has = function (k) { return m.indexOf(k) >= 0; };
    if (has("saddle")) out += ell(B.cx, B.cy - B.ry * 0.55, B.rx * 1.25, B.ry * 0.75, C.second);
    if (has("bodySecond")) out += ell(B.cx + B.rx * 0.5, B.cy - B.ry * 0.3, B.rx * 0.6, B.ry * 0.7, C.second);
    if (has("spots") || has("merle")) out += speckle(R, B.cx, B.cy, B.rx, B.ry, C.second, has("merle"), has("merle") ? 6 : 12);
    if (has("chest") || has("blaze") || has("lowerLight") || has("huskyMask") || has("urajiro")) {
      if (L.pose === "long") out += ell(B.cx - B.rx * 0.75, B.cy + B.ry * 0.25, B.rx * 0.35, B.ry * 0.75, C.light);
      else out += ell(B.cx, B.cy + B.ry * 0.15, B.rx * 0.52, B.ry * 0.85, C.light);
    }
    if (has("tanPoints") && !has("chest")) out += L.pose === "long" ? "" : ell(B.cx, B.cy - B.ry * 0.25, B.rx * 0.3, B.ry * 0.22, C.tan);
    return out;
  }

  // ---------- face ----------
  function face(L, H, C) {
    var hx = H.hx, hy = H.hy, hw = H.hw, hh = H.hh, E = L.eyes, out = "";
    var mz = { short: [0.4, 0.24, 0.48, 0.36], medium: [0.36, 0.3, 0.52, 0.38], long: [0.3, 0.4, 0.62, 0.46] }[L.muzzle];
    var mcx = hx, mcy = hy + hh * mz[2], mrx = hw * mz[0], mry = hh * mz[1];
    var mcol = L.muzzleColor || C.light;
    if (L.jowls) out += ell(mcx - mrx * 0.55, mcy + mry * 0.45, mrx * 0.62, mry * 0.75, mcol) + ell(mcx + mrx * 0.55, mcy + mry * 0.45, mrx * 0.62, mry * 0.75, mcol);
    out += ell(mcx, mcy, mrx, mry, mcol);
    if (L.beard) out += el("path", { d: scallop(mcx, mcy + mry * 0.7, mrx * 1.0, mry * 0.9, 9, 3, 0), fill: L.beard });
    // eyes
    var ex = hw * 0.38, ey = hy + hh * 0.02, er = hw * 0.13 * E.size;
    [-1, 1].forEach(function (sd) {
      var x = hx + sd * ex;
      if (E.ring || lum(C.head) < 0.3) out += el("circle", { cx: n(x), cy: n(ey), r: n(er * 1.28), fill: E.ring || shade(C.head, 0.32) });
      if (E.color !== "#2b1d1d") { out += el("circle", { cx: n(x), cy: n(ey), r: n(er), fill: "#1d1414" }) + el("circle", { cx: n(x), cy: n(ey), r: n(er * 0.78), fill: sd < 0 && E.left ? E.left : E.color }) + el("circle", { cx: n(x), cy: n(ey), r: n(er * 0.4), fill: "#1d1414" }); }
      else out += el("circle", { cx: n(x), cy: n(ey), r: n(er), fill: E.color });
      out += el("circle", { cx: n(x + er * 0.32), cy: n(ey - er * 0.35), r: n(er * 0.36), fill: "#fff" }) + el("circle", { cx: n(x - er * 0.35), cy: n(ey + er * 0.35), r: n(er * 0.16), fill: "#fff" });
      if (E.droopy) out += el("path", { d: "M" + n(x - er * 1.25) + " " + n(ey - er * 0.35) + " Q" + n(x) + " " + n(ey - er * 0.95) + " " + n(x + er * 1.25) + " " + n(ey - er * 0.35), fill: "none", stroke: OUT, "stroke-width": 2.2, "stroke-linecap": "round" });
      if (E.brows) out += el("path", { d: scallop(x + sd * 1, ey - er * 1.55, er * 1.3, er * 0.55, 7, 2.2, 0), fill: E.brows, transform: "rotate(" + (sd * -10) + " " + n(x) + " " + n(ey - er * 1.5) + ")" });
      out += ell(x + sd * er * 0.6, ey + er * 1.7, er * 0.85, er * 0.45, L.blush, { opacity: 0.55 });
    });
    if (L.wrinkles) {
      out += el("path", { d: "M" + n(hx - 9) + " " + n(hy - hh * 0.45) + " q9 -5 18 0 M" + n(hx - 6) + " " + n(hy - hh * 0.32) + " q6 -3 12 0", fill: "none", stroke: shade(C.head, -0.35), "stroke-width": 2, "stroke-linecap": "round" });
      out += el("path", { d: "M" + n(mcx - mrx * 0.95) + " " + n(mcy - mry * 0.75) + " q" + n(mrx * 0.95) + " " + n(-mry * 0.55) + " " + n(mrx * 1.9) + " 0", fill: "none", stroke: shade(mcol, -0.35), "stroke-width": 2, "stroke-linecap": "round" });
    }
    // nose + mouth
    var ny = hy + hh * mz[3], nw = hw * (L.muzzle === "short" ? 0.16 : 0.14);
    out += el("path", { d: "M" + n(hx - nw) + " " + n(ny - nw * 0.45) + " Q" + n(hx) + " " + n(ny - nw * 0.85) + " " + n(hx + nw) + " " + n(ny - nw * 0.45) + " Q" + n(hx + nw * 0.9) + " " + n(ny + nw * 0.55) + " " + n(hx) + " " + n(ny + nw * 0.7) + " Q" + n(hx - nw * 0.9) + " " + n(ny + nw * 0.55) + " " + n(hx - nw) + " " + n(ny - nw * 0.45) + "Z", fill: L.nose });
    out += ell(hx - nw * 0.35, ny - nw * 0.25, nw * 0.3, nw * 0.18, "#fff", { opacity: 0.55 });
    var my = ny + nw * 0.7, mw = L.smile ? 8 : 6, mc = shade(L.muzzleColor || C.light, -0.6);
    if (L.tongue) out += el("path", { d: "M" + n(hx - 5) + " " + n(my + 5) + " Q" + n(hx - 5.5) + " " + n(my + 15) + " " + n(hx) + " " + n(my + 15) + " Q" + n(hx + 5.5) + " " + n(my + 15) + " " + n(hx + 5) + " " + n(my + 5) + "Z", fill: "#ff7d96", stroke: OUT, "stroke-width": 1.6 }) + el("path", { d: "M" + n(hx) + " " + n(my + 7) + " L" + n(hx) + " " + n(my + 12), stroke: "#e0526e", "stroke-width": 1.3 });
    out += el("path", { d: "M" + n(hx) + " " + n(my - 1) + " L" + n(hx) + " " + n(my + 3) + " M" + n(hx - mw) + " " + n(my + 1) + " Q" + n(hx - mw / 2) + " " + n(my + (L.smile ? 8 : 6)) + " " + n(hx) + " " + n(my + 3) + " Q" + n(hx + mw / 2) + " " + n(my + (L.smile ? 8 : 6)) + " " + n(hx + mw) + " " + n(my + 1), fill: "none", stroke: mc, "stroke-width": 2, "stroke-linecap": "round" });
    if (L.tooth) out += el("path", { d: "M" + n(hx - 7) + " " + n(my + 5) + " l2 -5 l2 5Z M" + n(hx + 3) + " " + n(my + 5) + " l2 -5 l2 5Z", fill: "#fff", stroke: OUT, "stroke-width": 1 });
    return out;
  }

  // ---------- main ----------
  function svg(breed, opts) {
    opts = opts || {};
    var L = merge(DEFAULTS, breed.look || {});
    var c = L.coat, C = { base: c.base, head: c.head || c.base, body: c.body || c.base, light: c.light, second: c.second, tan: c.tan };
    var id = (opts.id || breed.id || "dog").replace(/[^a-z0-9_-]/gi, "");
    var R = rng(breed.id || id), H = headGeom(L), out = "", B;
    MX = H.hx;

    // body geometry
    if (L.pose === "long") B = { cx: 114, cy: 150, rx: 54 * L.build, ry: 26, tx: 108 + 46 * L.build, ty: 140 };
    else B = { cx: 100, cy: 150, rx: 38 * L.build, ry: 34, tx: 100 + 34 * L.build, ty: 158 };

    out += ell(L.pose === "long" ? 112 : 100, 188, L.pose === "long" ? 74 : 58 * L.build, 7, "#000", { opacity: 0.09 });
    out += el("g", { class: "tail", style: "transform-origin:" + B.tx + "px " + B.ty + "px" }, tail(L, B, C));

    var bodyD, clipBody = id + "-b";
    if (L.pose === "long") {
      // stubby legs: rear pair + front pair
      [[94, 1], [148, 1], [82, 0], [136, 0]].forEach(function (p) {
        var col = p[1] ? shade(C.body, -0.08) : C.body;
        out += el("rect", merge({ x: p[0] - 9, y: 156, width: 18, height: 28, rx: 9, fill: col }, outl())) + ell(p[0], 183, 11, 6.5, L.marks.indexOf("socks") >= 0 ? C.light : col, outl(2.2));
      });
      bodyD = L.fluff >= 1 ? scallop(B.cx, B.cy, B.rx, B.ry, 18, 3.5) : null;
    } else {
      [-1, 1].forEach(function (sd) { out += ell(B.cx + sd * B.rx * 0.82, 170, 17 * L.build, 15, C.body, outl()); });
      bodyD = L.fluff >= 1 ? scallop(B.cx, B.cy, B.rx, B.ry, 14, 4) : null;
    }
    var bodyShape = bodyD ? el("path", { d: bodyD }) : ell(B.cx, B.cy, B.rx, B.ry, "");
    out += el("defs", {}, el("clipPath", { id: clipBody }, bodyShape) + el("clipPath", { id: id + "-h" }, el("path", { d: headPath(L, H) })));
    out += bodyD ? el("path", merge({ d: bodyD, fill: C.body }, outl())) : ell(B.cx, B.cy, B.rx, B.ry, C.body, outl());
    out += el("g", { "clip-path": "url(#" + clipBody + ")" }, bodyMarks(L, B, C, R));
    if (L.fluff >= 1 && L.pose !== "long") out += el("path", { d: scallop(B.cx, B.cy - B.ry * 0.35, B.rx * 0.62, B.ry * 0.5, 10, 4, 0), fill: L.marks.indexOf("chest") >= 0 || L.marks.indexOf("lowerLight") >= 0 || L.marks.indexOf("blaze") >= 0 ? C.light : shade(C.body, 0.18) });
    if (L.pose !== "long") {
      [-1, 1].forEach(function (sd) {
        var x = B.cx + sd * 13, pc = L.marks.indexOf("socks") >= 0 ? C.light : C.body;
        out += el("rect", merge({ x: n(x - 10), y: 146, width: 20, height: 36, rx: 10, fill: C.body }, outl()));
        out += ell(x, 182, 12, 7.5, pc, outl(2.2));
        out += el("path", { d: "M" + n(x - 3.5) + " 179 v5 M" + n(x + 3.5) + " 179 v5", stroke: shade(pc, -0.3), "stroke-width": 1.6, "stroke-linecap": "round" });
      });
    }
    // silky long hair curtains (behind head, over body)
    if (L.silky) {
      [-1, 1].forEach(function (sd) {
        var x = H.hx + sd * H.hw * 0.85;
        out += el("path", merge({ d: "M" + n(x - sd * 14) + " " + n(H.hy - H.hh * 0.6) + " C" + n(x + sd * 22) + " " + n(H.hy) + " " + n(x + sd * 16) + " " + n(H.hy + H.hh * 1.6) + " " + n(x + sd * 6) + " " + n(H.hy + H.hh * 2.25) + " Q" + n(x - sd * 6) + " " + n(H.hy + H.hh * 2.1) + " " + n(x - sd * 14) + " " + n(H.hy + H.hh * 1.8) + "Z", fill: L.silky }, outl(2.2)));
      });
    }
    // collar
    if (L.collar) {
      var cy = L.pose === "long" ? H.hy + H.hh * 0.92 : 128, cw = L.pose === "long" ? 30 : 30 * L.build;
      out += el("path", merge({ d: "M" + n(H.hx - cw) + " " + n(cy - 3) + " Q" + n(H.hx) + " " + n(cy + 9) + " " + n(H.hx + cw) + " " + n(cy - 3) + " L" + n(H.hx + cw) + " " + n(cy + 4) + " Q" + n(H.hx) + " " + n(cy + 16) + " " + n(H.hx - cw) + " " + n(cy + 4) + "Z", fill: L.collar }, outl(2)));
      if (L.barrel) out += el("g", {}, el("rect", merge({ x: n(H.hx - 13), y: n(cy + 9), width: 26, height: 18, rx: 7, fill: "#b9773f" }, outl(2))) + el("path", { d: "M" + n(H.hx - 6) + " " + n(cy + 9) + " v18 M" + n(H.hx + 6) + " " + n(cy + 9) + " v18", stroke: "#7b4a22", "stroke-width": 2 }));
      else out += el("circle", merge({ cx: n(H.hx), cy: n(cy + 14), r: 5, fill: "#ffd34d" }, outl(1.8)));
    }
    out += earsBack(L, H, C);
    var hp = headPath(L, H);
    out += el("path", merge({ d: hp, fill: C.head }, outl()));
    out += el("g", { "clip-path": "url(#" + id + "-h)" }, headMarks(L, H, C, R));
    if (L.fluff >= 2) out += el("path", { d: hp, fill: "none", stroke: OUT, "stroke-width": 2.4, "stroke-linejoin": "round" });
    out += face(L, H, C);
    out += earsFront(L, H, C);
    if (L.topknot) out += el("path", merge({ d: scallop(H.hx, H.hy - H.hh * 0.95, H.hw * 0.45, H.hh * 0.3, 9, 4, 0), fill: L.topknot }, outl(2.2)));
    if (L.bow) {
      var bx = H.hx + (L.topknot ? 0 : H.hw * 0.42), by = H.hy - H.hh * (L.topknot ? 1.18 : 0.86);
      out += el("g", { transform: "rotate(" + (L.topknot ? 0 : 18) + " " + n(bx) + " " + n(by) + ")" },
        el("path", merge({ d: "M" + n(bx) + " " + n(by) + " L" + n(bx - 13) + " " + n(by - 8) + " L" + n(bx - 13) + " " + n(by + 8) + "Z M" + n(bx) + " " + n(by) + " L" + n(bx + 13) + " " + n(by - 8) + " L" + n(bx + 13) + " " + n(by + 8) + "Z", fill: L.bow }, outl(1.8))) +
        el("circle", merge({ cx: n(bx), cy: n(by), r: 4, fill: shade(L.bow, -0.15) }, outl(1.6))));
    }
    var title = opts.title === false ? "" : el("title", {}, (breed.name || "Dog") + " illustration");
    return el("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 200 200", class: "dog", role: "img", "aria-label": (breed.name || "Dog") + " illustration" }, title + out);
  }

  var api = { svg: svg, DEFAULTS: DEFAULTS, shade: shade };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.DogArt = api;
})(this);
