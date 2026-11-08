# SLI RESOURCES

Official website for **SLI RESOURCES** — smart automation products for homes, farms and industries, and home of **Hydrolynk™**, the automatic water pump controller.

**Live site:** https://rexphenom.github.io/Sli_Resources/

## Structure

```
index.html            Single-page site (Home, Services, Hydrolynk, Founder, Contact)
404.html              Not-found page
robots.txt            Crawler rules
sitemap.xml           Sitemap
assets/
  css/styles.css      Design system and layout (dark + light themes)
  js/main.js          Theme toggle, mobile menu, scroll-spy, reveal, WhatsApp enquiry form
  img/                Optimised images (WebP / PNG), favicon, social preview
```

No build step, no dependencies to install. It is plain HTML, CSS and JavaScript, served by GitHub Pages straight from `main`.

## Editing content

| What | Where |
| --- | --- |
| Phone / WhatsApp number | Search `2349023226544` in `index.html` and `assets/js/main.js` |
| Email | Search `sliresourcess@gmail.com` in `index.html` |
| Hydrolynk price | `.price` block in the `#hydrolynk` section of `index.html` |
| Colours and fonts | `:root` and `[data-theme="light"]` tokens at the top of `assets/css/styles.css` |

## Images

Replace images in `assets/img/` keeping the same file names. Prefer WebP, under 100 KB each.

## Deploy

Push to `main`. GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) publishes automatically.
