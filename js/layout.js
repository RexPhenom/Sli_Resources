// Injects the shared announcement + header + footer so every page stays in sync,
// and fills in editable content (price, WhatsApp links, products) from js/config.js.
// Loaded at the very start of <body> so the header exists before first paint.
(function () {
  const C = window.SLI;
  const body = document.body;
  const page = body.dataset.page || "";

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;
  const safeHref = (h) => (/^(?:[a-z0-9_-]+\.html(?:#[\w-]*)?|#[\w-]+|https:\/\/[^\s"'<>]+)$/i.test(h || "") ? h : "");
  const safeImg = (p) => (/^assets\/(?:products\/)?[a-z0-9._-]+\.(?:webp|png|jpe?g)$/i.test(p || "") ? p : "");
  window.sliWa = wa;

  const main = [
    ["index.html", "Home", "home"],
    ["about.html", "About", "about"],
    ["services.html", "Services", "services"],
    ["hydrolynk.html", "Hydrolynk", "hydrolynk"],
    ["contact.html", "Contact", "contact"],
  ];
  const li = ([h, t, k]) => `<li><a href="${h}"${k === page ? ' aria-current="page"' : ""}>${t}</a></li>`;

  /* ---------- Announcement (editable, dismissible once per visit) ---------- */
  const A = C.announcement || {};
  let dismissed = false;
  try { dismissed = !!sessionStorage.getItem("sli-announce"); } catch (_) {}
  const aLink = safeHref(A.linkHref);
  const announce = !A.enabled || !A.text || page === "hydrolynk" || dismissed ? "" : `
  <div class="announce" id="announce" role="region" aria-label="Announcement">
    ${esc(A.text)}${aLink && A.linkText ? ` <a href="${esc(aLink)}">${esc(A.linkText)}</a>` : ""}
    <button type="button" id="announce-x" aria-label="Dismiss announcement">×</button>
  </div>`;

  /* ---------- Header ---------- */
  body.insertAdjacentHTML("afterbegin", `
  <a class="skip" href="#main">Skip to content</a>${announce}
  <header class="site-header" id="site-header">
    <div class="container nav">
      <a class="brand" href="index.html" aria-label="${esc(C.name)} home">
        <span class="brand-mark"><img src="assets/mark.png" alt="" width="30" height="30"></span>
        <span class="word">${esc(C.name)}</span>
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

  /* ---------- Product catalogue (rendered from config) ---------- */
  const BOX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/></svg>';
  function productCard(p, i) {
    const img = safeImg(p.image);
    const sold = p.status === "sold-out", soon = p.status === "coming-soon";
    const priced = /\d/.test(p.price || "");
    const label = sold ? "Sold out" : soon ? "Ask to be notified" : priced ? "Buy on WhatsApp" : "Ask on WhatsApp";
    const msg = soon ? `Hello ${C.name}, please let me know when the ${p.name} is available.`
      : priced ? `Hello ${C.name}, I want to buy ${p.name}.` : `Hello ${C.name}, I'd like to ask about the ${p.name}.`;
    const badge = sold ? '<span class="badge badge--off">Sold out</span>' : soon ? '<span class="badge">Coming soon</span>' : "";
    return `<article class="card product reveal" style="--d:${(i % 3) * 0.06}s">
      <div class="pimg">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" width="640" height="480">` : BOX}${badge}</div>
      <h3>${esc(p.name)}</h3><p>${esc(p.blurb)}</p>
      ${p.id === "hydrolynk" ? '<a class="more" href="hydrolynk.html">Full details</a>' : ""}
      <div class="pfoot"><strong class="pprice">${esc(p.price)}</strong>
        ${sold ? `<span class="btn btn--sm btn--off" aria-disabled="true">${label}</span>` : `<a class="btn btn--sm btn--wa" href="${esc(wa(msg))}" rel="noopener" target="_blank">${label}</a>`}</div>
    </article>`;
  }
  /* ---------- Footer, editable text, reveal, WhatsApp (after the page is parsed) ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer">
      <div class="container">
        <div class="foot-grid">
          <div>
            <a class="brand" href="index.html" aria-label="${esc(C.name)} home" style="margin-bottom:var(--s4)">
              <span class="brand-mark"><img src="assets/mark.png" alt="" width="30" height="30" loading="lazy"></span>
              <span class="word">${esc(C.name)}</span>
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
            <li><a href="${esc(wa("Hello " + C.name + ", I'd like to make an enquiry."))}" rel="noopener" target="_blank">WhatsApp</a></li>
            <li><a href="tel:${esc(C.phone.replace(/\s/g, ""))}">${esc(C.phone)}</a></li>
            <li><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></li>
            <li><a href="${esc(safeHref(C.linkedin) || "#")}" rel="noopener" target="_blank">LinkedIn</a></li>
            <li>${esc(C.location)}</li></ul></div>
        </div>
        <div class="foot-bottom"><span>© ${new Date().getFullYear()} ${esc(C.name)}. All rights reserved.</span><span>Led by ${esc(C.founder)} · <a href="admin.html">Admin</a></span></div>
      </div>
    </footer>`);

    // Product catalogue (must run before the reveal observer so cards animate in)
    const grid = document.getElementById("products-grid");
    if (grid && Array.isArray(C.products) && C.products.length) grid.innerHTML = C.products.map(productCard).join("");

    // Editable text: price, phone, email, LinkedIn, and every WhatsApp link
    document.querySelectorAll('[data-sli="price"]').forEach((el) => { el.textContent = C.price; });
    document.querySelectorAll('[data-sli="phone"]').forEach((el) => { el.textContent = C.phone; if (el.tagName === "A") el.href = "tel:" + C.phone.replace(/\s/g, ""); });
    document.querySelectorAll('[data-sli="email"]').forEach((el) => { el.textContent = C.email; if (el.tagName === "A") el.href = "mailto:" + C.email; });
    document.querySelectorAll('[data-sli="linkedin"]').forEach((el) => { const h = safeHref(C.linkedin); if (h) el.href = h; });
    document.querySelectorAll("a[data-wa]").forEach((a) => { a.href = wa(a.dataset.wa); });

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
