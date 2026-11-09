// Floating WhatsApp button. Visitor picks what they need → WhatsApp opens with a ready-written message.
(function () {
  const C = window.SLI;
  if (!C || !C.whatsapp) return;
  const needs = [
    "Buy Hydrolynk",
    "A custom smart product",
    "IoT or smart energy system",
    "Hardware or software design",
    "Prototyping & manufacturing",
    "Product consultancy",
    "Something else",
  ];
  const chips = needs.map((n) => `<button type="button" class="wa-chip" data-v="${n.replace(/"/g, "&quot;")}" aria-pressed="false">${n.replace("&", "&amp;")}</button>`).join("");

  document.body.insertAdjacentHTML("beforeend", `
  <div class="wa" id="wa">
    <div class="wa-teaser" id="wa-teaser" hidden>👋 Questions about Hydrolynk or a custom build? <b>Chat with us</b><button type="button" aria-label="Dismiss" id="wa-x">×</button></div>
    <section class="wa-panel" id="wa-panel" role="dialog" aria-label="Chat on WhatsApp" hidden>
      <header><div><strong>Chat with SLI RESOURCES</strong><span>We typically reply within a few hours</span></div><button type="button" id="wa-close" aria-label="Close">×</button></header>
      <div class="wa-body">
        <p>What do you need help with?</p>
        <div class="wa-chips" id="wa-chips">${chips}</div>
        <label for="wa-name">Your name</label><input id="wa-name" class="field" autocomplete="name" placeholder="e.g. Amaka">
        <label for="wa-note">Anything to add? <em>(optional)</em></label><textarea id="wa-note" class="field" rows="2" placeholder="Tell us a bit more…"></textarea>
        <button type="button" class="btn wa-send" id="wa-send">Continue on WhatsApp</button>
        <small>This opens WhatsApp with your message ready — just tap Send.</small>
        <a class="wa-mail" href="mailto:${C.email}">Prefer email? Write to ${C.email}</a>
      </div>
    </section>
    <button type="button" class="wa-fab" id="wa-fab" aria-label="Chat on WhatsApp" aria-expanded="false" aria-controls="wa-panel">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C9.4 3 4 8.3 4 14.8c0 2.2.6 4.3 1.8 6.1L4 29l8.3-2.1a12 12 0 0 0 3.7.6c6.6 0 12-5.3 12-11.8S22.6 3 16 3z"/><path fill="#17803f" d="M12.2 9.5c-.3 0-.6.1-.9.5-.4.5-1.1 1.3-1.1 2.6 0 1.6 1.1 3.1 1.3 3.3.2.2 2.4 3.7 5.9 5.1 2.9 1.1 3.5.9 4.1.8.6-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.7-.5l-2.2-1.1c-.3-.1-.6-.2-.8.2l-1 1.2c-.2.2-.4.2-.7.1-1.8-.9-3-1.8-4.2-3.7-.3-.5.3-.5.9-1.7.1-.3 0-.5 0-.6l-1-2.4c-.3-.6-.5-.5-.8-.5z"/></svg>
      <span>Chat</span>
    </button>
  </div>`);

  const $ = (id) => document.getElementById(id);
  const panel = $("wa-panel"), fab = $("wa-fab"), teaser = $("wa-teaser");
  let chosen = "";
  const open = (v) => { panel.hidden = !v; teaser.hidden = true; fab.setAttribute("aria-expanded", v); if (v) $("wa-name").focus({ preventScroll: true }); };

  fab.addEventListener("click", () => open(panel.hidden));
  $("wa-close").addEventListener("click", () => open(false));
  teaser.addEventListener("click", (e) => { if (e.target.id !== "wa-x") open(true); });
  $("wa-x").addEventListener("click", (e) => { e.stopPropagation(); teaser.hidden = true; try { sessionStorage.setItem("wa-seen", "1"); } catch (_) {} });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { open(false); fab.focus(); } });

  $("wa-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".wa-chip"); if (!b) return;
    chosen = b.dataset.v;
    document.querySelectorAll(".wa-chip").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  });

  // Pre-select a topic when a page/card passes ?topic=
  const t = new URLSearchParams(location.search).get("topic");
  if (t) document.querySelectorAll(".wa-chip").forEach((x) => { if (x.dataset.v.toLowerCase().startsWith(t.toLowerCase().slice(0, 10))) x.click(); });

  $("wa-send").addEventListener("click", () => {
    const name = $("wa-name").value.trim(), note = $("wa-note").value.trim();
    const lines = [
      `Hello SLI RESOURCES 👋${name ? ", my name is " + name + "." : ""}`,
      `I'm interested in: ${chosen || "learning more about your products and services"}.`,
      note ? `Details: ${note}` : "",
      `(Sent from your website — ${document.title.split(" — ")[0] || "SLI RESOURCES"} page)`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(lines)}`, "_blank", "noopener");
    open(false);
  });

  // Gentle "pop out" teaser once per visit, after a few seconds
  let seen = false; try { seen = !!sessionStorage.getItem("wa-seen"); } catch (_) {}
  if (!seen) setTimeout(() => { if (panel.hidden) { teaser.hidden = false; try { sessionStorage.setItem("wa-seen", "1"); } catch (_) {} } }, 7000);
})();
