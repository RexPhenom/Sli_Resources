// Day / night theme. Loaded in <head> so the right theme paints first (no flash).
(function () {
  var KEY = "sli-theme", root = document.documentElement, saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var start = saved === "dark" || saved === "light" ? saved : (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.setAttribute("data-theme", start);
  root.classList.add("js");

  var ICON = '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';

  function sync(v) {
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-pressed", v === "dark");
      b.setAttribute("aria-label", v === "dark" ? "Switch to day mode" : "Switch to night mode");
      b.title = v === "dark" ? "Day mode" : "Night mode";
    });
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", v === "dark" ? "#06121b" : "#f2f7fa");
  }

  window.sliTheme = {
    get: function () { return root.getAttribute("data-theme"); },
    set: function (v) { root.setAttribute("data-theme", v); try { localStorage.setItem(KEY, v); } catch (e) {} sync(v); },
    toggle: function () { this.set(this.get() === "dark" ? "light" : "dark"); },
    button: function () {
      var b = document.createElement("button");
      b.type = "button"; b.className = "theme-toggle"; b.innerHTML = ICON;
      b.addEventListener("click", function () { window.sliTheme.toggle(); });
      setTimeout(function () { sync(root.getAttribute("data-theme")); }, 0);
      return b;
    }
  };
})();
