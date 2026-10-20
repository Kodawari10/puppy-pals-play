/* 🌙 Night mode: a cosy, starry dark theme for bedtime browsing.
   Follows the device's light/dark setting until you pick one with the 🌙/☀️ button or the T key;
   your choice is saved in localStorage ("puppyPals.theme"). The <head> sets the theme before first paint. */
(function () {
  var KEY = "puppyPals.theme", root = document.documentElement, btn = document.getElementById("themebtn");
  var COLORS = { day: "#ff7aa8", night: "#2a2140" };
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function saved() { try { var v = localStorage.getItem(KEY); return v === "night" || v === "day" ? v : null; } catch (e) { return null; } }
  function system() { return mq && mq.matches ? "night" : "day"; }
  function current() { return root.getAttribute("data-theme") === "night" ? "night" : "day"; }
  function paint(t) {
    root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", COLORS[t]);
    if (!btn) return;
    var night = t === "night";
    btn.textContent = night ? "☀️" : "🌙";
    btn.setAttribute("aria-pressed", night);
    btn.setAttribute("aria-label", "Night mode " + (night ? "on" : "off"));
    btn.title = night ? "Night mode on (T for day)" : "Night mode off (T for night)";
  }
  function set(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
    paint(t);
    if (btn) { btn.classList.remove("spin"); void btn.offsetWidth; btn.classList.add("spin"); }
    if (window.PuppySound) PuppySound.play("pop");
    if (window.PuppyPals && PuppyPals.toast) PuppyPals.toast(t === "night" ? "🌙 Night mode on. Sweet dreams, pups!" : "☀️ Good morning, pups!");
  }
  function toggle() { set(current() === "night" ? "day" : "night"); }
  if (btn) btn.onclick = toggle;
  document.addEventListener("keydown", function (e) {
    if (e.key !== "t" && e.key !== "T") return;
    var t = e.target, tag = t && t.tagName;
    if (e.ctrlKey || e.metaKey || e.altKey || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    toggle();
  });
  // no saved choice yet: follow the device when it switches between light and dark
  function onSys() { if (!saved()) paint(system()); }
  if (mq) { if (mq.addEventListener) mq.addEventListener("change", onSys); else if (mq.addListener) mq.addListener(onSys); }
  paint(saved() || system());
  window.PuppyTheme = { get: current, set: set, toggle: toggle, saved: saved };
})();
