// Injects the shared announcement + header + footer so every page stays in sync.
// Loaded at the very start of <body> so the header exists before first paint.
(function () {
  const C = window.SLI;
  const body = document.body;
  const page = body.dataset.page || "";
  const wa = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

  const main = [
    ["index.html", "Home", "home"],
    ["about.html", "About", "about"],
    ["services.html", "Services", "services"],
    ["hydrolynk.html", "Hydrolynk", "hydrolynk"],
    ["contact.html", "Contact", "contact"],
  ];
  const li = ([h, t, k]) => `<li><a href="${h}"${k === page ? ' aria-current="page"' : ""}>${t}</a></li>`;

  /* ---------- Announcement (dismissible, once per visit) ---------- */
  let dismissed = false;
  try { dismissed = !!sessionStorage.getItem("sli-announce"); } catch (_) {}
  const announce = page === "hydrolynk" || dismissed ? "" : `
  <div class="announce" id="announce" role="region" aria-label="Announcement">
    New: <a href="hydrolynk.html">Hydrolynk smart pump controller</a> — ${C.price}. Order in minutes on WhatsApp.
    <button type="button" id="announce-x" aria-label="Dismiss announcement">×</button>
  </div>`;

  /* ---------- Header ---------- */
  body.insertAdjacentHTML("afterbegin", `
  <a class="skip" href="#main">Skip to content</a>${announce}
  <header class="site-header" id="site-header">
    <div class="container nav">
      <a class="brand" href="index.html" aria-label="SLI RESOURCES home">
        <span class="brand-mark"><img src="assets/mark.png" alt="" width="30" height="30"></span>
        <span class="word">SLI RESOURCES</span>
      </a>
      <ul class="nav-links" id="menu">${main.map(li).join("")}
        <li><a class="btn btn--primary" href="hydrolynk.html#buy">Get Hydrolynk</a></li>
      </ul>
      <div class="nav-right" id="nav-right">
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
      </div>
    </div>
  </header>`);

  const right = document.getElementById("nav-right");
  if (window.sliTheme) right.insertBefore(window.sliTheme.button(), right.firstChild);

  const btn = right.querySelector(".nav-toggle"), menu = document.getElementById("menu"), header = document.getElementById("site-header");
  const setMenu = (open) => { menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); btn.textContent = open ? "Close" : "Menu"; };
  btn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); btn.focus(); } });
  document.addEventListener("click", (e) => { if (menu.classList.contains("open") && !header.contains(e.target)) setMenu(false); });
  matchMedia("(min-width: 861px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

  const ax = document.getElementById("announce-x");
  if (ax) ax.addEventListener("click", () => { document.getElementById("announce").remove(); try { sessionStorage.setItem("sli-announce", "1"); } catch (_) {} });

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Footer, reveal, WhatsApp (after the page is parsed) ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer">
      <div class="container">
        <div class="foot-grid">
          <div>
            <a class="brand" href="index.html" aria-label="SLI RESOURCES home" style="margin-bottom:var(--s4)">
              <span class="brand-mark"><img src="assets/mark.png" alt="" width="30" height="30" loading="lazy"></span>
              <span class="word">SLI RESOURCES</span>
            </a>
            <p>Smart automation products for homes, farms and industries. Scalable, sustainable technology that empowers Africa and beyond.</p>
          </div>
          <div><h4>Explore</h4><ul>${main.map(li).join("")}</ul></div>
          <div><h4>What we do</h4><ul>
            <li><a href="hydrolynk.html">Hydrolynk pump controller</a></li>
            <li><a href="services.html#s1">IoT solutions</a></li>
            <li><a href="services.html#s3">Hardware design</a></li>
            <li><a href="services.html#s6">Prototyping &amp; manufacturing</a></li>
            <li><a href="contact.html">Start a project</a></li></ul></div>
          <div><h4>Reach us</h4><ul>
            <li><a href="${wa("Hello SLI RESOURCES, I'd like to make an enquiry.")}" rel="noopener" target="_blank">WhatsApp</a></li>
            <li><a href="tel:${C.phone.replace(/\s/g, "")}">${C.phone}</a></li>
            <li><a href="mailto:${C.email}">${C.email}</a></li>
            <li><a href="${C.linkedin}" rel="noopener" target="_blank">LinkedIn</a></li>
            <li>${C.location}</li></ul></div>
        </div>
        <div class="foot-bottom"><span>© ${new Date().getFullYear()} SLI RESOURCES. All rights reserved.</span><span>Led by ${C.founder}.</span></div>
      </div>
    </footer>`);

    // Scroll reveal
    const els = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
      els.forEach((el) => io.observe(el));
    } else els.forEach((el) => el.classList.add("in"));

    // Floating WhatsApp chat
    const s = document.createElement("script"); s.src = "js/whatsapp.js"; document.body.appendChild(s);
  });
})();
