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
| Admin (private) | `admin.html` |

## Admin page

`admin.html` lets you change the site without touching code: add, edit, reorder or delete **products** (with photos), update **contact info**, and turn the **announcement bar** on or off. Changes are saved straight to this repo and the site updates in about a minute.

**First time on a device:** register your email, choose a 6–12 digit PIN, and paste a private GitHub key once (the page explains each step):

1. https://github.com/settings/personal-access-tokens/new
2. Repository access: only `Sli_Resources`. Permissions: **Contents → Read and write**.
3. Paste the key into the admin page.

**After that:** sign in with just your email and PIN. The key is encrypted with your PIN (PBKDF2 + AES-GCM) and stays in that browser only, never in the repo. Use the **Security** tab to change your email or PIN, and **Lock** to sign out.

Good to know: the login is per device (a new phone or computer needs registering once with a GitHub key), the email is not verified by a server, and 10 wrong PINs wipe the saved login from that device. "Forgot your PIN?" resets the device so you can register again.

The admin writes `js/config.js` and product photos to `assets/products/`.

## Structure

```
css/styles.css     Design system: tokens, components, day/night theme
js/config.js       Contact details, announcement and products. Written by the admin page.
js/admin.js        Admin page logic (sign-in, editing, publishing)
css/admin.css      Admin page styles
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
| Phone, WhatsApp, email, products, announcement | The admin page (or `js/config.js` by hand) |
| Colours, fonts, spacing | `:root` tokens at the top of `css/styles.css` |
| Header, footer, menu | `js/layout.js` (changes apply to every page) |
| WhatsApp chat options | `needs` list in `js/whatsapp.js` |

## Images

Replace files in `assets/` keeping the same names. Use WebP and keep each under about 100 KB.

## Deploy

Push to `main`. GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) publishes automatically.
