// Contact form: sends by WhatsApp or opens an email draft. No server needed.
(function () {
  const C = window.SLI, form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const say = (msg, err) => { status.textContent = msg; status.classList.toggle("err", !!err); };

  // Pre-select the topic from ?topic=
  const t = new URLSearchParams(location.search).get("topic");
  if (t) { const sel = form.elements.topic; [...sel.options].forEach((o) => { if (o.text.toLowerCase().startsWith(t.toLowerCase().slice(0, 10))) sel.value = o.value; }); }

  let channel = "whatsapp";
  form.querySelectorAll("button[data-channel]").forEach((b) => b.addEventListener("click", () => { channel = b.dataset.channel; }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const name = f.name.value.trim(), email = f.email.value.trim(), topic = f.topic.value, msg = f.message.value.trim();

    if (!name) { say("Please tell us your name.", true); f.name.focus(); return; }
    if (!msg) { say("Please add a short message so we know how to help.", true); f.message.focus(); return; }
    if (channel === "email" && email && !/^\S+@\S+\.\S+$/.test(email)) { say("That email address doesn't look right.", true); f.email.focus(); return; }

    const body = [`Hello SLI RESOURCES,`, ``, `My name is ${name}.`, email ? `Email: ${email}` : "", `Interested in: ${topic}`, ``, msg].filter((x) => x !== "").join("\n");

    if (channel === "email") {
      location.href = `mailto:${C.email}?subject=${encodeURIComponent("Enquiry: " + topic)}&body=${encodeURIComponent(body)}`;
      say("Opening your email app…");
    } else {
      const w = window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
      if (!w) location.href = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(body)}`;
      say("Opening WhatsApp — just tap Send.");
    }
  });
})();
