/* Pup stickers: turn a pup (with its outfit) into a cute PNG card to save or share. No libraries, just canvas. */
(function () {
  "use strict";
  var W = 600, H = 760, PINK = "#ff7aa8", INK = "#5b3a4a";
  var FONT = '"Nunito","Quicksand",ui-rounded,"Segoe UI",system-ui,sans-serif';
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function heart(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.fillStyle = col;
    c.fill(new Path2D("M0 8.5s-7.5-4.6-9.3-9.2C-10.6-4-8.6-7.5-5.1-7.5c2.1 0 3.9 1.2 5.1 3 1.2-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8C7.5 3.9 0 8.5 0 8.5z")); c.restore();
  }
  function fit(c, text, max, size, weight) {
    do { c.font = weight + " " + size + "px " + FONT; size -= 2; } while (c.measureText(text).width > max && size > 14);
  }
  function slug(b) { return "puppy-pals-" + b.id.replace(/[^a-z0-9-]/gi, "") + ".png"; }
  function petLine(b) {
    var n = window.PuppyPals && PuppyPals.pets ? PuppyPals.pets(b.id) : 0;
    return n >= 10 ? "🥰 Best friends · " + n + " pets" : n > 0 ? "💕 " + n + (n === 1 ? " pet" : " pets") : "🐾 New friend";
  }
  function artImage(b) {
    var look = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b;
    var src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(DogArt.svg(look, { id: "stk-" + b.id, title: false }));
    return new Promise(function (ok, bad) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = bad; im.src = src; });
  }
  // draws the sticker; resolves with the canvas
  function make(b) {
    return artImage(b).then(function (im) {
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var c = cv.getContext("2d");
      var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#ffd6e6"); g.addColorStop(1, "#ffe9c7");
      rr(c, 0, 0, W, H, 48); c.fillStyle = g; c.fill();
      c.save(); rr(c, 0, 0, W, H, 48); c.clip(); c.fillStyle = "#ffffff55";
      for (var y = 20, row = 0; y < H; y += 46, row++) for (var x = (row % 2) * 23 + 12; x < W; x += 46) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }
      c.restore();
      rr(c, 30, 30, W - 60, H - 60, 36); c.fillStyle = "#fffaf6"; c.fill();
      c.setLineDash([14, 10]); c.lineWidth = 5; c.strokeStyle = "#ffc2d6"; c.stroke(); c.setLineDash([]);
      // portrait on a soft circle
      c.fillStyle = "#ffeef4"; c.beginPath(); c.arc(W / 2, 250, 180, 0, 7); c.fill();
      c.drawImage(im, W / 2 - 190, 60, 380, 380);
      heart(c, 110, 110, 34, PINK); heart(c, 500, 140, 26, "#ffb3cc"); heart(c, 486, 400, 30, PINK);
      c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = INK;
      fit(c, b.name, W - 120, 52, 900); c.fillText(b.name, W / 2, 500);
      c.fillStyle = "#8a6676"; fit(c, "📍 " + b.origin + " · " + b.size + " pup", W - 120, 26, 700); c.fillText("📍 " + b.origin + " · " + b.size + " pup", W / 2, 542);
      var traits = b.traits.join(" · "); fit(c, traits, W - 120, 24, 700); c.fillText(traits, W / 2, 578);
      // pill with pets
      var pl = petLine(b); c.font = "800 26px " + FONT; var pw = c.measureText(pl).width + 48;
      rr(c, W / 2 - pw / 2, 604, pw, 50, 25); c.fillStyle = "#ffe0ec"; c.fill(); c.fillStyle = "#d44d7e"; c.fillText(pl, W / 2, 638);
      c.fillStyle = PINK; c.font = "900 24px " + FONT; c.fillText("Puppy Pals 🐾", W / 2, 700);
      return cv;
    });
  }
  function blob(cv) { return new Promise(function (ok) { cv.toBlob(ok, "image/png"); }); }
  // Save (or share on phones that support sharing files). Resolves with "shared", "saved" or "cancelled".
  function save(b) {
    return make(b).then(blob).then(function (bl) {
      var name = slug(b), file = typeof File === "function" ? new File([bl], name, { type: "image/png" }) : null;
      var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
      if (touch && file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: b.name + " sticker", text: b.name + " from Puppy Pals 🐾" })
          .then(function () { return "shared"; }, function (e) { if (e && e.name === "AbortError") return "cancelled"; return download(bl, name); });
      }
      return download(bl, name);
    });
  }
  function download(bl, name) {
    var url = URL.createObjectURL(bl), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return "saved";
  }
  window.PuppySticker = { make: make, save: save, fileName: slug, size: [W, H] };
})();
