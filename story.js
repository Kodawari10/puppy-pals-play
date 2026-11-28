/* 📖 Story time: pick a hero pup, a friend pup and a place, and Puppy Pals writes a short story about them using
   each pup's traits, home country, hello and fun fact. 🗣️ Read it to me uses the browser's voice. Choices saved in localStorage. */
(function () {
  "use strict";
  var B = window.BREEDS, $ = function (id) { return document.getElementById(id); };
  var KEY = "puppyPals.story";
  var PLACES = [
    { id: "beach", emoji: "🏖️", name: "Beach", deco: "🌊 🐚 ☀️", sky: "beach",
      go: "went to the sunny beach", play: ["built the tallest sandcastle ever, with a moat for tiny crabs", "chased the waves and ran away giggling every time they splashed back", "dug a giant hole and found a shiny shell"],
      snack: "a cool slice of watermelon", end: "watched the sun sink into the sea" },
    { id: "park", emoji: "🌳", name: "Park", deco: "🌼 🦋 🌳", sky: "park",
      go: "skipped off to the big green park", play: ["rolled down the grassy hill again and again", "played tag around the old oak tree", "followed a butterfly all the way to the duck pond"],
      snack: "crunchy apple slices", end: "napped in the shade of a tree" },
    { id: "snow", emoji: "❄️", name: "Snowy hills", deco: "⛄ ❄️ 🏔️", sky: "snow",
      go: "bounced through the fluffy snow on the hills", play: ["built a snow-pup with a carrot nose", "slid down the hill on a red sled, whooshing all the way", "made pup-angels in the soft snow"],
      snack: "a warm bowl of pumpkin", end: "cuddled up by a cosy fire" },
    { id: "space", emoji: "🚀", name: "Outer space", deco: "🪐 ⭐ 🌙", sky: "space",
      go: "zoomed into outer space in a little rocket", play: ["bounced across the Moon in giant floaty hops", "counted the rings around a sparkly planet", "waved hello to a friendly shooting star"],
      snack: "star-shaped biscuits", end: "flew home and dreamed of the stars" },
    { id: "castle", emoji: "🏰", name: "Castle", deco: "👑 🏰 🚩", sky: "castle",
      go: "trotted up to a tall castle on a hill", play: ["found a secret tunnel behind a bookshelf", "were made royal knights with shiny paper crowns", "played hide-and-seek in the twisty towers"],
      snack: "a royal feast of carrots and blueberries", end: "fell asleep on velvet cushions" },
    { id: "rain", emoji: "🌧️", name: "Rainy day", deco: "☔ 🌈 💧", sky: "rain",
      go: "put on tiny raincoats and stepped outside", play: ["jumped in every puddle on the street, SPLASH!", "raced paper boats down a little stream", "found the end of a beautiful rainbow"],
      snack: "warm sweet potato", end: "dried off in fluffy towels" }
  ];
  function byId(id) { return B.filter(function (b) { return b.id === id; })[0] || null; }
  function place(id) { return PLACES.filter(function (p) { return p.id === id; })[0] || null; }
  function nick(b) { return window.PuppyPals && PuppyPals.nick ? PuppyPals.nick(b.id) : ""; }
  function nameOf(b) { var n = nick(b); return n ? n + " the " + b.name : "the " + b.name; }
  function an(w) { return /^[aeiou]/i.test(w) ? "an" : "a"; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function hello(b) {
    if (!window.PuppyWorld) return "Hello!";
    var id = PuppyWorld.countriesOf(b)[0], c = PuppyWorld.countries().filter(function (x) { return x.id === id; })[0];
    return c ? c.hi : "Hello!";
  }
  function randPup(not) { var pool = B.filter(function (b) { return b.id !== not; }); return pool[Math.floor(Math.random() * pool.length)].id; }
  function load() {
    var o; try { o = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { o = null; }
    var s = { hero: o && byId(o.hero) ? o.hero : "shiba", friend: o && byId(o.friend) ? o.friend : "corgi", place: o && place(o.place) ? o.place : "park", v: o && o.v >= 0 && o.v < 3 ? Math.floor(o.v) : 0 };
    if (s.friend === s.hero) s.friend = randPup(s.hero);
    return s;
  }
  var st = load(), dlg = $("story"), reading = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  // the story: five short sentences, built from the pups' own data
  function write(s) {
    s = s || st;
    var h = byId(s.hero), f = byId(s.friend), p = place(s.place), v = s.v % p.play.length;
    var t1 = h.traits[0].toLowerCase(), t2 = h.traits[1].toLowerCase(), ft = f.traits[0].toLowerCase();
    return [
      "Once upon a time, there was " + an(t1) + " " + t1 + " and " + t2 + " " + (nick(h) ? "pup called " + nick(h) + ", " + an(h.name) + " " + h.name + " from " + h.origin : h.name + " from " + h.origin) + ".",
      "One morning, " + nameOf(h) + " called out “" + hello(h) + "” to " + an(ft) + " " + ft + " friend, " + nameOf(f) + ", and together they " + p.go + ".",
      cap(nameOf(h)) + " and " + nameOf(f) + " " + p.play[v] + ".",
      "Then they shared " + p.snack + ", and " + nameOf(f) + " said: “Did you know? " + f.fact.replace(/\s+$/, "") + "”",
      "At the end of the day, the two best friends " + p.end + ". The end. 🐾"
    ];
  }
  function art(b, tag) { var d = window.PuppyPals && PuppyPals.dressed ? PuppyPals.dressed(b) : b; return DogArt.svg(d, { id: "story-" + tag + "-" + b.id, title: false }); }
  function paint(pop) {
    var h = byId(st.hero), f = byId(st.friend), p = place(st.place);
    $("stscene").className = "stscene sky-" + p.sky;
    $("stdeco").textContent = p.deco;
    $("stheroart").innerHTML = art(h, "h"); $("stfriendart").innerHTML = art(f, "f");
    $("stscene").setAttribute("aria-label", h.name + " and " + f.name + " at the " + p.name.toLowerCase());
    $("stheroname").textContent = h.name; $("stfriendname").textContent = f.name;
    $("sttext").innerHTML = "";
    write().forEach(function (line) { var el = document.createElement("p"); el.textContent = line; $("sttext").appendChild(el); });
    $("stplaces").querySelectorAll(".stplace").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.id === st.place)); });
    if (pop) { var t = $("sttext"); t.classList.remove("stpop"); void t.offsetWidth; t.classList.add("stpop"); }
  }
  function step(who, d) {
    var ids = B.map(function (b) { return b.id; }), other = who === "hero" ? st.friend : st.hero, i = ids.indexOf(st[who]);
    do { i = (i + d + ids.length) % ids.length; } while (ids[i] === other);
    st[who] = ids[i]; changed(cap(who === "hero" ? "hero" : "friend") + ": " + byId(st[who]).name + ".");
  }
  function changed(msg) { stopRead(); save(); paint(true); if (window.PuppySound) PuppySound.play("pop"); $("stlive").textContent = msg + " New story ready."; }
  function shuffleAll() {
    st.hero = randPup(); st.friend = randPup(st.hero); st.place = PLACES[Math.floor(Math.random() * PLACES.length)].id; st.v = Math.floor(Math.random() * 3);
    changed("Surprise story: " + byId(st.hero).name + " and " + byId(st.friend).name + " at the " + place(st.place).name.toLowerCase() + ".");
  }
  // 🗣️ read the story aloud with the browser's own voice
  function synth() { return window.speechSynthesis && window.SpeechSynthesisUtterance ? window.speechSynthesis : null; }
  function paintRead(on) { var b = $("stread"); b.setAttribute("aria-pressed", String(!!on)); b.textContent = on ? "⏹️ Stop reading" : "🗣️ Read it to me"; b.classList.toggle("on", !!on); }
  function stopRead() { var s = synth(); if (reading && s) s.cancel(); reading = null; paintRead(false); }
  function read() {
    var s = synth(); if (!s) return;
    if (reading) { stopRead(); $("stlive").textContent = "Stopped reading."; return; }
    s.cancel();
    var u = new SpeechSynthesisUtterance(write().join(" ").replace(/🐾/g, "")); u.lang = "en-US"; u.rate = 0.9; u.pitch = 1.2;
    var vs = (s.getVoices && s.getVoices()) || [], v = vs.filter(function (x) { return /^en(-|_|$)/i.test(x.lang || ""); });
    if (v.length) try { u.voice = v.filter(function (x) { return /female|samantha|zira|google us/i.test(x.name || ""); })[0] || v[0]; } catch (e) {}
    u.onend = u.onerror = function () { if (reading === u) { reading = null; paintRead(false); } };
    reading = u; paintRead(true); $("stlive").textContent = "Reading the story aloud."; s.speak(u);
  }
  $("stplaces").innerHTML = PLACES.map(function (p) { return '<button type="button" class="mkchip stplace" data-id="' + p.id + '" aria-pressed="false"><span aria-hidden="true">' + p.emoji + "</span> " + p.name + "</button>"; }).join("");
  $("stplaces").addEventListener("click", function (e) { var b = e.target.closest(".stplace"); if (!b) return; st.place = b.dataset.id; st.v = (st.v + 1) % 3; changed("Place: " + place(st.place).name + "."); });
  $("stheroprev").onclick = function () { step("hero", -1); }; $("stheronext").onclick = function () { step("hero", 1); };
  $("stfriendprev").onclick = function () { step("friend", -1); }; $("stfriendnext").onclick = function () { step("friend", 1); };
  $("stswap").onclick = function () { var t = st.hero; st.hero = st.friend; st.friend = t; changed("Swapped! " + byId(st.hero).name + " is the hero now."); };
  $("stnew").onclick = shuffleAll;
  $("stread").onclick = read;
  if (!synth()) $("stread").hidden = true;
  $("storybtn").onclick = function () { st = load(); paint(false); $("stlive").textContent = ""; if (!synth()) $("stread").hidden = true; dlg.showModal(); $("stnew").focus({ preventScroll: true }); };
  $("stclose").onclick = function () { dlg.close(); };
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { stopRead(); $("storybtn").focus({ preventScroll: true }); });
  dlg.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "r" || e.key === "R") { e.preventDefault(); read(); }
    else if (e.key === "n" || e.key === "N") { e.preventDefault(); shuffleAll(); }
  });
  paint(false);
  window.PuppyStory = { write: write, places: function () { return PLACES.map(function (p) { return p.id; }); }, get: function () { return JSON.parse(JSON.stringify(st)); }, hello: hello };
})();
