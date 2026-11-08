/* SLI RESOURCES — interactions (no dependencies) */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var burger = document.getElementById("burger");
  var sheet = document.getElementById("sheet");
  var themeBtn = document.getElementById("themeToggle");

  /* ---------- Theme ---------- */
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("sli-theme", theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f5f9fc" : "#060a0f");
    if (themeBtn) themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  }
  if (themeBtn) {
    setTheme(root.getAttribute("data-theme") || "dark");
    themeBtn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    if (!burger || !sheet) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.classList.toggle("open", open);
    sheet.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", function (m) {
      if (m.matches) setMenu(false);
    });
  }

  /* ---------- Header border on scroll ---------- */
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Scroll-spy ---------- */
  var ids = ["home", "services", "hydrolynk", "founder", "contact"];
  var sections = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spyLinks = document.querySelectorAll("[data-spy]");

  function setActive(id) {
    spyLinks.forEach(function (a) {
      if (a.getAttribute("data-spy") === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }
  setActive("home");

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Enquiry form → WhatsApp ---------- */
  var form = document.getElementById("enquiry");
  var note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var topic = form.elements.topic.value;
      var msg = form.elements.message.value.trim();

      if (!name) {
        note.textContent = "Please enter your name first.";
        form.elements.name.focus();
        return;
      }
      note.textContent = "";

      var text =
        "Hello SLI RESOURCES, my name is " + name + ".\n" +
        "I'm interested in: " + topic + "." +
        (msg ? "\n\n" + msg : "");
      var url = "https://wa.me/2349023226544?text=" + encodeURIComponent(text);
      var win = window.open(url, "_blank", "noopener");
      if (!win) window.location.href = url; // popup blocked
      note.textContent = "Opening WhatsApp…";
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
