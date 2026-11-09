/* SLI RESOURCES — admin.
   No server needed: the page reads and writes js/config.js (and product images) in the
   GitHub repo using a private fine-grained token that lives only in this browser.
   GitHub Pages then republishes the site in about a minute. */
(function () {
  "use strict";

  const OWNER = "rexphenom", REPO = "Sli_Resources", BRANCH = "main", CFG_PATH = "js/config.js";
  const API = "https://api.github.com";
  const KEY = "sli-admin-token";
  const STATUS = { available: "In stock", "coming-soon": "Coming soon", "sold-out": "Sold out" };
  const IMG_OK = /^assets\/(?:products\/)?[a-z0-9._-]+\.(?:webp|png|jpe?g)$/i;

  /* ---------- tiny helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k in el) el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const ICON = {
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  };
  const icon = (n) => { const t = document.createElement("template"); t.innerHTML = ICON[n]; return t.content.firstChild; };

  let toastTimer;
  function toast(msg, type) {
    const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = "toast"; }, type === "err" ? 7000 : 4500);
  }

  const b64dec = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  const b64enc = (str) => { const bytes = new TextEncoder().encode(str); let s = ""; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s); };
  const bufToB64 = (buf) => { const bytes = new Uint8Array(buf); let s = ""; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s); };

  /* ---------- token storage (this device only) ---------- */
  const store = {
    get() { try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY); } catch (e) { return null; } },
    set(t, keep) { try { (keep ? localStorage : sessionStorage).setItem(KEY, t); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {} },
  };

  /* ---------- GitHub API ---------- */
  let token = "";
  async function gh(path, opts) {
    const o = opts || {};
    const res = await fetch(API + path, {
      method: o.method || "GET",
      headers: Object.assign({ Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + token }, o.body ? { "Content-Type": "application/json" } : {}),
      body: o.body ? JSON.stringify(o.body) : undefined,
      cache: "no-store",
    });
    let data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) { const err = new Error((data && data.message) || "HTTP " + res.status); err.status = res.status; throw err; }
    return data;
  }
  const encPath = (p) => p.split("/").map(encodeURIComponent).join("/");
  function friendly(err) {
    if (err && err.userMsg) return err.message;
    if (!err || err.status == null) return "Couldn’t reach GitHub. Check your connection and try again.";
    if (err.status === 401) return "GitHub rejected that key. It may be wrong or expired. Create a new one and try again.";
    if (err.status === 403) return "That key isn’t allowed to change this site. Set Contents to “Read and write”.";
    if (err.status === 404) return "That key can’t see the Sli_Resources repository. When creating it, select that repository.";
    if (err.status === 409 || err.status === 422) return "The site was changed somewhere else.";
    return "GitHub said: " + err.message;
  }

  /* ---------- state ---------- */
  let cfg = null, orig = null, sha = "";
  const pending = {};   // image path -> base64 (uploaded on publish)
  const previews = {};  // image path -> blob: URL for instant preview
  let busy = false;

  function normalize(c) {
    const a = c.announcement || {};
    return {
      name: String(c.name || "SLI RESOURCES"), whatsapp: String(c.whatsapp || ""), phone: String(c.phone || ""), email: String(c.email || ""),
      linkedin: String(c.linkedin || ""), founder: String(c.founder || ""), location: String(c.location || ""), price: String(c.price || ""),
      announcement: { enabled: !!a.enabled, text: String(a.text || ""), linkText: String(a.linkText || ""), linkHref: String(a.linkHref || "") },
      products: (Array.isArray(c.products) ? c.products : []).map((p) => ({
        id: String(p.id || ""), name: String(p.name || ""), price: String(p.price || ""), blurb: String(p.blurb || ""),
        status: STATUS[p.status] ? p.status : "available", image: String(p.image || ""),
      })),
    };
  }
  function parseConfig(text) {
    const i = text.indexOf("{", text.indexOf("window.SLI")), j = text.lastIndexOf("}");
    if (i < 0 || j < i) throw new Error("bad");
    return normalize(JSON.parse(text.slice(i, j + 1)));
  }
  const serialize = (c) => "// SLI RESOURCES site settings.\n// Managed by the admin page (admin.html). Safe to edit by hand: keep everything after \"window.SLI =\" valid JSON.\nwindow.SLI = " + JSON.stringify(c, null, 2) + ";\n";

  async function loadConfig() {
    const repo = await gh(`/repos/${OWNER}/${REPO}`);
    if (repo.permissions && repo.permissions.push === false) { const e = new Error("read-only"); e.status = 403; throw e; }
    const f = await gh(`/repos/${OWNER}/${REPO}/contents/${encPath(CFG_PATH)}?ref=${BRANCH}`);
    let parsed;
    try { parsed = parseConfig(b64dec(f.content)); } catch (e) { const er = new Error("Couldn’t read js/config.js. It may have been edited by hand."); er.userMsg = true; throw er; }
    sha = f.sha; cfg = parsed; orig = clone(parsed);
  }

  /* ---------- change tracking ---------- */
  function changeCount() {
    let n = 0;
    ["whatsapp", "phone", "email", "linkedin", "founder", "location"].forEach((k) => { if (cfg[k] !== orig[k]) n++; });
    if (!same(cfg.announcement, orig.announcement)) n++;
    const o = new Map(orig.products.map((p) => [p.id, p])), s = new Map(cfg.products.map((p) => [p.id, p]));
    cfg.products.forEach((p) => { const q = o.get(p.id); if (!q || !same(q, p)) n++; });
    orig.products.forEach((p) => { if (!s.has(p.id)) n++; });
    if (cfg.products.length === orig.products.length && cfg.products.every((p) => o.has(p.id)) && cfg.products.map((p) => p.id).join() !== orig.products.map((p) => p.id).join()) n++;
    return n;
  }
  function updateBar() {
    const n = cfg ? changeCount() : 0, bar = $("#savebar");
    bar.hidden = n === 0;
    $("#save-msg").textContent = n === 1 ? "1 unsaved change" : n + " unsaved changes";
    $("#discard").disabled = busy; $("#publish").disabled = busy;
    document.querySelectorAll(".prow").forEach((row) => {
      const id = row.dataset.id, p = cfg.products.find((x) => x.id === id), q = orig.products.find((x) => x.id === id);
      row.classList.toggle("changed", !!p && (!q || !same(p, q)));
    });
  }
  window.addEventListener("beforeunload", (e) => { if (cfg && changeCount() > 0 && !busy) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- views ---------- */
  const show = (id) => { ["#view-connect", "#view-editor"].forEach((s) => { $(s).hidden = s !== id; }); $("#signout").hidden = id !== "#view-editor"; };

  /* ---------- tabs ---------- */
  const tabs = ["products", "site", "announce"];
  function selectTab(name, focus) {
    tabs.forEach((t) => {
      const on = t === name, b = $("#tab-" + t);
      b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; $("#panel-" + t).hidden = !on;
      if (on && focus) b.focus();
    });
  }
  tabs.forEach((t, i) => {
    $("#tab-" + t).addEventListener("click", () => selectTab(t));
    $("#tab-" + t).addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); selectTab(tabs[(i + 1) % tabs.length], true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); selectTab(tabs[(i + tabs.length - 1) % tabs.length], true); }
    });
  });

  /* ---------- products list ---------- */
  const imgSrc = (p) => previews[p] || p;
  function renderProducts(focusSel) {
    const list = $("#plist"); list.textContent = "";
    if (!cfg.products.length) list.append(h("li", { class: "empty", text: "No products yet. Tap “Add product” to create one." }));
    cfg.products.forEach((p, i) => {
      const thumb = h("div", { class: "pthumb" }, p.image && IMG_OK.test(p.image) ? h("img", { src: imgSrc(p.image), alt: "", loading: "lazy", on: { error: (e) => e.target.replaceWith(icon("box")) } }) : icon("box"));
      const pill = h("span", { class: "pill" + (p.status === "sold-out" ? " pill--off" : p.status === "coming-soon" ? " pill--soon" : ""), text: STATUS[p.status] });
      const isKey = p.id === "hydrolynk";
      list.append(h("li", { class: "prow", "data-id": p.id },
        thumb,
        h("div", { class: "pinfo" }, h("b", { text: p.name || "(unnamed)" }), h("span", { text: p.price || "No price" }), h("div", { class: "pmeta" }, pill, isKey && h("span", { class: "pill pill--key", text: "Featured" }))),
        h("div", { class: "pacts" },
          h("button", { class: "ib", type: "button", "data-act": "up", "data-id": p.id, "aria-label": "Move " + p.name + " up", disabled: i === 0 }, icon("up")),
          h("button", { class: "ib", type: "button", "data-act": "down", "data-id": p.id, "aria-label": "Move " + p.name + " down", disabled: i === cfg.products.length - 1 }, icon("down")),
          h("button", { class: "ib txt", type: "button", "data-act": "edit", "data-id": p.id, "aria-label": "Edit " + p.name, text: "Edit" }),
          h("button", { class: "ib danger", type: "button", "data-act": "del", "data-id": p.id, "aria-label": "Delete " + p.name, disabled: isKey, title: isKey ? "Hydrolynk can’t be deleted" : "Delete" }, icon("trash")))));
    });
    if (focusSel) { const f = list.querySelector(focusSel); if (f && !f.disabled) f.focus(); }
    updateBar();
  }
  $("#plist").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b || busy) return;
    const id = b.dataset.id, i = cfg.products.findIndex((p) => p.id === id); if (i < 0) return;
    const act = b.dataset.act;
    if (act === "edit") return openProduct(id);
    if (act === "del") {
      if (!confirm(`Delete “${cfg.products[i].name}”?\n\nIt will be removed from your Services page when you publish.`)) return;
      cfg.products.splice(i, 1); renderProducts(); return toast("Removed. Tap Publish to make it live.");
    }
    const j = act === "up" ? i - 1 : i + 1; if (j < 0 || j >= cfg.products.length) return;
    [cfg.products[i], cfg.products[j]] = [cfg.products[j], cfg.products[i]];
    renderProducts(`[data-act="${act}"][data-id="${id}"]`);
  });
  $("#add-product").addEventListener("click", () => { if (!busy) openProduct(null); });

  /* ---------- image handling ---------- */
  async function processImage(file) {
    if (!/^image\//.test(file.type)) throw new Error("Please choose a photo (JPG, PNG or WebP).");
    if (file.size > 20 * 1024 * 1024) throw new Error("That photo is too large. Please use one under 20 MB.");
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (e) { throw new Error("Couldn’t open that image. Try a different photo."); }
    const max = 960, sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    let ext = "webp", blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.82));
    if (!blob || blob.type !== "image/webp") { ext = "jpg"; blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85)); }
    if (!blob) throw new Error("Couldn’t process that image.");
    const path = `assets/products/img-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${ext}`;
    pending[path] = bufToB64(await blob.arrayBuffer()); previews[path] = URL.createObjectURL(blob);
    return path;
  }

  /* ---------- product dialog ---------- */
  const dlg = $("#pdlg");
  const slug = (s) => (String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "product");
  function uniqueId(base) { let id = base, n = 2; while (cfg.products.some((p) => p.id === id)) id = base + "-" + n++; return id; }

  function openProduct(id) {
    const existing = id ? cfg.products.find((p) => p.id === id) : null;
    const w = existing ? clone(existing) : { id: "", name: "", price: "", blurb: "", status: "available", image: "" };
    const err = h("p", { class: "err-text", role: "alert" });
    const name = h("input", { class: "field", id: "pf-name", maxLength: 80, autocomplete: "off", value: w.name, placeholder: "e.g. Smart Water Level Sensor" });
    const price = h("input", { class: "field", id: "pf-price", maxLength: 30, autocomplete: "off", value: w.price, placeholder: "₦30,000 or Ask for price" });
    const blurb = h("textarea", { class: "field", id: "pf-blurb", maxLength: 240, rows: 3, value: w.blurb, placeholder: "One or two sentences about what it does." });
    const count = h("span", { class: "cnt", text: w.blurb.length + "/240" });
    blurb.addEventListener("input", () => { count.textContent = blurb.value.length + "/240"; });
    const status = h("select", { class: "field", id: "pf-status" }, Object.entries(STATUS).map(([v, t]) => h("option", { value: v, text: t })));
    status.value = w.status;

    const thumb = h("div", { class: "pthumb" });
    const paintThumb = () => { thumb.textContent = ""; thumb.append(w.image && IMG_OK.test(w.image) ? h("img", { src: imgSrc(w.image), alt: "Product photo preview" }) : icon("box")); rm.hidden = !w.image; };
    const file = h("input", { type: "file", id: "pf-file", accept: "image/*" });
    const pick = h("label", { class: "btn btn--ghost btn--sm", for: "pf-file", text: "Choose photo" });
    const rm = h("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Remove photo", on: { click: () => { w.image = ""; paintThumb(); } } });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0]; if (!f) return; err.textContent = ""; pick.textContent = "Preparing…";
      try { w.image = await processImage(f); paintThumb(); } catch (e) { err.textContent = e.message; }
      pick.textContent = "Choose photo"; file.value = "";
    });

    const form = h("form", { novalidate: true, on: { submit: (e) => {
      e.preventDefault();
      const nm = name.value.trim();
      if (!nm) { err.textContent = "Please give the product a name."; name.focus(); return; }
      const item = { id: w.id, name: nm, price: price.value.trim(), blurb: blurb.value.trim(), status: status.value, image: w.image };
      if (existing) Object.assign(existing, item); else { item.id = uniqueId(slug(nm)); cfg.products.push(item); }
      dlg.close(); renderProducts(); toast(existing ? "Updated. Tap Publish to make it live." : "Added. Tap Publish to make it live.");
    } } },
      h("div", { class: "dlg-body" },
        h("label", { for: "pf-name", text: "Product name" }), name,
        h("div", { class: "row" },
          h("div", {}, h("label", { for: "pf-price", text: "Price" }), price),
          h("div", {}, h("label", { for: "pf-status", text: "Availability" }), status)),
        h("label", { for: "pf-blurb" }, "Short description ", count), blurb,
        h("label", { text: "Photo (optional)" }),
        h("div", { class: "imgbox" }, thumb, h("div", { class: "imgbox-btns" }, pick, file, rm)),
        h("small", { text: "A clear, bright photo works best. It is resized automatically." }),
        err),
      h("div", { class: "dlg-foot" },
        h("button", { class: "btn btn--ghost", type: "button", text: "Cancel", on: { click: () => dlg.close() } }),
        h("button", { class: "btn btn--primary", type: "submit", text: existing ? "Save product" : "Add product" })));
    dlg.textContent = "";
    dlg.append(h("div", { class: "dlg-head" }, h("h2", { id: "pdlg-title", text: existing ? "Edit product" : "Add product" }), h("button", { type: "button", "aria-label": "Close", text: "×", on: { click: () => dlg.close() } })), form);
    paintThumb(); dlg.showModal(); name.focus();
  }
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- contact info + announcement forms ---------- */
  const SITE = { whatsapp: "#s-whatsapp", phone: "#s-phone", email: "#s-email", linkedin: "#s-linkedin", founder: "#s-founder", location: "#s-location" };
  function fillSite() {
    Object.entries(SITE).forEach(([k, sel]) => { const el = $(sel); el.value = cfg[k]; el.oninput = () => { cfg[k] = el.value.trim(); updateBar(); }; });
    const A = cfg.announcement;
    $("#a-enabled").checked = A.enabled; $("#a-text").value = A.text; $("#a-linktext").value = A.linkText; $("#a-linkhref").value = A.linkHref;
    const sync = () => {
      A.enabled = $("#a-enabled").checked; A.text = $("#a-text").value.trim(); A.linkText = $("#a-linktext").value.trim(); A.linkHref = $("#a-linkhref").value;
      paintPreview(); updateBar();
    };
    ["#a-enabled", "#a-text", "#a-linktext", "#a-linkhref"].forEach((s) => { $(s).oninput = sync; $(s).onchange = sync; });
    paintPreview();
  }
  function paintPreview() {
    const A = cfg.announcement, box = $("#a-preview"); box.textContent = "";
    box.classList.toggle("off", !A.enabled || !A.text);
    if (!A.enabled) return box.append("The announcement bar is turned off.");
    if (!A.text) return box.append("Type a message to see the preview.");
    box.append(A.text);
    if (A.linkText && A.linkHref) box.append(" ", h("a", { href: "#", text: A.linkText, on: { click: (e) => e.preventDefault() } }));
  }

  /* ---------- validate + publish ---------- */
  function validate() {
    const bad = (tab, sel, msg) => { selectTab(tab); const el = sel && $(sel); if (el) el.focus(); return msg; };
    if (!/^\d{10,15}$/.test(cfg.whatsapp)) return bad("site", "#s-whatsapp", "WhatsApp number must be digits only with the country code, like 2349023226544.");
    if (!cfg.phone) return bad("site", "#s-phone", "Please add a phone number.");
    if (!/^\S+@\S+\.\S+$/.test(cfg.email)) return bad("site", "#s-email", "That email address doesn’t look right.");
    if (cfg.linkedin && !/^https:\/\/\S+$/.test(cfg.linkedin)) return bad("site", "#s-linkedin", "The LinkedIn link must start with https://");
    if (!cfg.founder) return bad("site", "#s-founder", "Please add the founder’s name.");
    if (cfg.announcement.enabled && !cfg.announcement.text) return bad("announce", "#a-text", "Add a message for the announcement bar, or turn it off.");
    const hy = cfg.products.find((p) => p.id === "hydrolynk");
    if (!hy) return bad("products", null, "The Hydrolynk product is missing. Discard your changes and try again.");
    if (!hy.price) return bad("products", null, "Hydrolynk needs a price. Tap Edit on it.");
    const noName = cfg.products.find((p) => !p.name.trim());
    if (noName) return bad("products", null, "Every product needs a name.");
    return null;
  }

  async function publish() {
    if (busy) return;
    const problem = validate(); if (problem) return toast(problem, "err");
    busy = true; const btn = $("#publish"); btn.textContent = "Publishing…"; updateBar();
    try {
      const used = new Set(cfg.products.map((p) => p.image));
      for (const path of Object.keys(pending)) {
        if (!used.has(path)) continue;
        btn.textContent = "Uploading photo…";
        await gh(`/repos/${OWNER}/${REPO}/contents/${encPath(path)}`, { method: "PUT", body: { message: "Admin: add product photo", content: pending[path], branch: BRANCH } });
        delete pending[path];
      }
      btn.textContent = "Saving…";
      cfg.price = cfg.products.find((p) => p.id === "hydrolynk").price;
      const res = await gh(`/repos/${OWNER}/${REPO}/contents/${encPath(CFG_PATH)}`, { method: "PUT", body: { message: "Admin: update site content", content: b64enc(serialize(cfg)), sha, branch: BRANCH } });
      sha = res.content.sha; orig = clone(cfg);
      toast("Published! Your site will update in about a minute.", "ok");
    } catch (e) {
      if (e.status === 409 || e.status === 422) {
        if (confirm("Your site was changed somewhere else since you opened this page.\n\nReload the latest version? Your unsaved changes here will be lost.")) { busy = false; await reload(); return; }
        toast("Not published. Reload to get the latest version before publishing.", "err");
      } else toast(friendly(e), "err");
    } finally { busy = false; btn.textContent = "Publish changes"; if (cfg) { renderProducts(); } }
  }
  $("#publish").addEventListener("click", publish);
  $("#discard").addEventListener("click", () => {
    if (busy || !confirm("Discard all unsaved changes?")) return;
    cfg = clone(orig); fillSite(); renderProducts(); toast("Changes discarded.");
  });

  async function reload() {
    try { await loadConfig(); fillSite(); renderProducts(); toast("Loaded the latest version.", "ok"); } catch (e) { toast(friendly(e), "err"); }
  }

  /* ---------- sign in ---------- */
  function enter() {
    $("#who").textContent = ""; $("#who").append("Connected to ", h("b", { text: OWNER + "/" + REPO }));
    fillSite(); renderProducts(); selectTab("products"); show("#view-editor");
  }
  async function connect(t, keep, statusEl) {
    token = t;
    try { await loadConfig(); store.set(t, keep); enter(); return true; }
    catch (e) {
      token = "";
      if (statusEl) { statusEl.textContent = friendly(e); statusEl.classList.add("err"); }
      return false;
    }
  }
  $("#connect-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const st = $("#connect-status"), btn = $("#connect-btn"), t = $("#token").value.trim();
    st.classList.remove("err"); st.textContent = "";
    if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) { st.textContent = "That doesn’t look like a GitHub key. It should start with github_pat_"; st.classList.add("err"); $("#token").focus(); return; }
    btn.disabled = true; btn.textContent = "Connecting…";
    const ok = await connect(t, $("#keep").checked, st);
    btn.disabled = false; btn.textContent = "Connect"; if (ok) $("#token").value = "";
  });
  $("#signout").addEventListener("click", () => {
    if (cfg && changeCount() > 0 && !confirm("You have unsaved changes. Sign out anyway?")) return;
    store.clear(); cfg = null; location.reload();
  });
  $("#a-preview").addEventListener("click", (e) => e.preventDefault());

  /* ---------- start ---------- */
  (async function init() {
    const saved = store.get();
    if (!saved) { show("#view-connect"); return; }
    const loading = h("p", { class: "fine", text: "Loading your site…", role: "status" }); $("#app").prepend(loading);
    let inLocal = false; try { inLocal = !!localStorage.getItem(KEY); } catch (e) {}
    const ok = await connect(saved, inLocal, null);
    loading.remove();
    if (!ok) { store.clear(); show("#view-connect"); const st = $("#connect-status"); st.textContent = "Please sign in again."; }
  })();
})();
