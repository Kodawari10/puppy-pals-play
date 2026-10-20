/* "Which pup are you?" personality match: 5 cute questions, then the breed that fits your answers best.
   Scoring is deterministic (same answers, same pup); the last match is kept in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.match";
  // each answer: t = traits it likes (2 pts each), g = groups (1 pt), s = sizes (pts), o = origin words (2 pts)
  var QS = [
    { q: "Pick a perfect Saturday 🌤️", a: [
      ["🏃 Zoomies at the park", { t: ["Energetic", "Playful", "Athletic", "Lively", "Exuberant", "Sprightly"], g: ["Herding", "Sporting"] }],
      ["🛋️ A cozy nap on the sofa", { t: ["Calm", "Easygoing", "Low-key", "Gentle", "Patient", "Adaptable", "Cat-like"], g: ["Toy"] }],
      ["🧭 Exploring wherever I like", { t: ["Curious", "Inquisitive", "Nosy", "Bold", "Independent", "Merry", "Stubborn"], g: ["Hound", "Terrier"] }],
      ["🎉 A party with all my friends", { t: ["Friendly", "Outgoing", "Sociable", "Cheerful", "Happy", "Affectionate"] }]] },
    { q: "Your friends say you are…", a: [
      ["🛡️ Super loyal", { t: ["Loyal", "Devoted", "Protective", "Dependable", "Watchful"], g: ["Working"] }],
      ["🤪 Silly and fun", { t: ["Mischievous", "Playful", "Charming", "Sassy", "Feisty", "Cheerful", "Spunky"] }],
      ["🧠 Really clever", { t: ["Smart", "Clever", "Brilliant", "Trainable", "Focused", "Obedient", "Bright"], g: ["Herding"] }],
      ["🌸 Sweet and gentle", { t: ["Gentle", "Affectionate", "Loving", "Patient", "Polite", "Good-natured"] }]] },
    { q: "Pick a snack 🍡", a: [
      ["🍡 A tiny mochi", { s: { toy: 4, small: 1 } }],
      ["🍙 A rice ball", { s: { small: 4, medium: 1 } }],
      ["🍱 A big bento", { s: { medium: 3, large: 2 } }],
      ["🍕 The whole party platter", { s: { giant: 4, large: 2 } }]] },
    { q: "Something surprising happens! You…", a: [
      ["🦁 Bravely check it out", { t: ["Brave", "Courageous", "Fearless", "Confident", "Bold"] }],
      ["😌 Stay cool and do my own thing", { t: ["Calm", "Dignified", "Independent", "Low-key", "Easygoing", "Proud", "Stubborn", "Aloof", "Noble"] }],
      ["📣 Tell everyone about it", { t: ["Talkative", "Alert", "Lively", "Outgoing", "Exuberant", "Vocal"] }],
      ["🤗 Go find a hug", { t: ["Affectionate", "Loving", "Gentle", "Sociable", "Eager"] }]] },
    { q: "Your dream home 🏡", a: [
      ["🏙️ A cozy city flat", { g: ["Toy", "Non-Sporting"], s: { toy: 1, small: 1 } }],
      ["🌾 A farm with lots of space", { g: ["Herding", "Working"], s: { large: 1 } }],
      ["🏔️ Snowy mountains", { o: ["Siberia", "Alaska", "Switzerland", "Japan", "Tibet", "Canada", "Newfoundland"], g: ["Working"] }],
      ["🌲 A cottage by the forest", { g: ["Hound", "Terrier", "Sporting"], t: ["Merry", "Curious", "Food-motivated", "Clever"] }]] }
  ];
  function points(b, w) {
    var p = 0, tr = b.traits.map(function (t) { return t.toLowerCase(); });
    (w.t || []).forEach(function (t) { if (tr.indexOf(t.toLowerCase()) >= 0) p += 2; });
    if ((w.g || []).indexOf(b.group) >= 0) p += 1;
    if (w.s && w.s[b.size]) p += w.s[b.size];
    (w.o || []).forEach(function (o) { if (b.origin.indexOf(o) >= 0) p += 2; });
    return p;
  }
  // answers: array of answer indexes (0-3), one per question
  function score(answers) {
    var best = -1, top = [];
    B.forEach(function (b) {
      var p = 0;
      answers.forEach(function (k, i) { var a = QS[i] && QS[i].a[k]; if (a) p += points(b, a[1]); });
      if (p > best) { best = p; top = [b]; } else if (p === best) top.push(b);
    });
    var h = 7; answers.forEach(function (k, i) { h = (h * 31 + (k + 1) * (i + 3)) % 9973; });
    return top[h % top.length];
  }
  function why(b, answers) {
    var liked = {};
    answers.forEach(function (k, i) { ((QS[i].a[k] || [])[1].t || []).forEach(function (t) { liked[t.toLowerCase()] = 1; }); });
    var shared = b.traits.filter(function (t) { return liked[t.toLowerCase()]; });
    var list = (shared.length ? shared : b.traits).map(function (t) { return t.toLowerCase(); });
    var txt = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
    return (shared.length ? "Just like you, they're " : "They're ") + txt + "! A " + b.size + " pup from " + b.origin + ".";
  }
  var dlg = $("match"), st = null;
  function saved() { try { var id = localStorage.getItem(KEY); return B.filter(function (b) { return b.id === id; })[0] || null; } catch (e) { return null; } }
  function label() { var b = saved(); $("matchlast").textContent = b ? "You're a " + b.name + "!" : ""; }
  function art(b) { return DogArt.svg(window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b); }
  function start() { st = { i: 0, answers: [], locked: false }; $("mplay").hidden = false; $("mdone").hidden = true; ask(); }
  function ask() {
    var Q = QS[st.i]; st.locked = false;
    $("mprog").textContent = "Question " + (st.i + 1) + " of " + QS.length;
    $("mbar").style.width = (st.i / QS.length * 100) + "%";
    $("mq").textContent = Q.q;
    var box = $("mopts"); box.innerHTML = "";
    Q.a.forEach(function (a, k) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "qopt mopt"; btn.dataset.k = k;
      btn.innerHTML = '<span class="qk">' + (k + 1) + "</span>" + a[0];
      btn.onclick = function () { pick(k, btn); };
      box.appendChild(btn);
    });
    box.firstChild.focus({ preventScroll: true });
  }
  function pick(k, btn) {
    if (st.locked) return; st.locked = true;
    st.answers.push(k); btn.classList.add("chosen");
    if (window.PuppySound) PuppySound.play("pop");
    setTimeout(function () { if (st.answers.length < QS.length) { st.i++; ask(); } else done(); }, 260);
  }
  function done() {
    var b = score(st.answers);
    try { localStorage.setItem(KEY, b.id); } catch (e) {}
    $("mbar").style.width = "100%";
    $("mplay").hidden = true; $("mdone").hidden = false;
    $("mart").innerHTML = art(b);
    $("mname").textContent = "You're a " + b.name + "!";
    $("mwhy").textContent = why(b, st.answers);
    $("mmeet").textContent = "Meet " + b.name + " 🐾"; $("mmeet").dataset.id = b.id;
    dlg.dataset.result = b.id;
    if (window.PuppySound) { PuppySound.play("fanfare"); setTimeout(function () { PuppySound.play("bark", b); }, 500); }
    label();
    $("mmeet").focus({ preventScroll: true });
  }
  $("matchbtn").onclick = function () { start(); dlg.showModal(); };
  $("magain").onclick = start;
  $("mclose").onclick = function () { dlg.close(); };
  $("mmeet").onclick = function () {
    var id = $("mmeet").dataset.id; dlg.dataset.meeting = "1"; dlg.close(); delete dlg.dataset.meeting;
    if (window.PuppyPals) PuppyPals.openBreed(id);
  };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (!dlg.dataset.meeting) $("matchbtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (!st || $("mplay").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !st.locked) { var o = document.querySelectorAll(".mopt")[n - 1]; if (o) { e.preventDefault(); o.click(); } }
  });
  window.PuppyMatch = { score: score, questions: QS, why: why };
  label();
})();
