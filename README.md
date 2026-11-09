# SLI RESOURCES

Official website for **SLI RESOURCES**: smart automation products for homes, farms and industries, and home of **Hydrolynk™**, the automatic water pump controller.

**Live site:** https://rexphenom.github.io/Sli_Resources/

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Services | `services.html` |
| Hydrolynk (product) | `hydrolynk.html` |
| Contact | `contact.html` |
| Not found | `404.html` |

## Structure

```
css/styles.css     Design system: tokens, components, day/night theme
js/config.js       Phone, email, price, links. Edit contact details here.
js/theme.js        Day / night mode (remembers the visitor's choice)
js/layout.js       Shared announcement bar, header, footer, scroll reveal
js/whatsapp.js     Floating WhatsApp chat panel
js/contact.js      Contact form (sends by WhatsApp or email)
assets/            Optimised images, favicon, social preview
```

No build step and nothing to install. Plain HTML, CSS and JavaScript served by GitHub Pages from `main`.

## Editing

| What | Where |
| --- | --- |
| Phone, WhatsApp, email, price | `js/config.js` (the WhatsApp number also appears in page links: search `2349023226544`) |
| Colours, fonts, spacing | `:root` tokens at the top of `css/styles.css` |
| Header, footer, menu | `js/layout.js` (changes apply to every page) |
| WhatsApp chat options | `needs` list in `js/whatsapp.js` |

## Images

Replace files in `assets/` keeping the same names. Use WebP and keep each under about 100 KB.

## Deploy

Push to `main`. GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) publishes automatically.
