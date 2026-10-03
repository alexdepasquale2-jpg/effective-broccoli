# Foley & Fable — Custom Shopify Theme

A polished, literary Shopify 2.0 theme built for **Foley & Fable** — a blind book date shop where stories linger and shadows muse.

## What's included

- **Atmospheric homepage** — full-viewport hero, featured products, how-it-works ritual, brand story, newsletter
- **Product pages** — gallery, variant picker, wax-seal add-to-cart, "what's included" details
- **Collection pages** — elegant product grid with pagination
- **Cart drawer** — slide-out cart from any page
- **Mobile responsive** — hamburger nav, stacked layouts, touch-friendly controls
- **Theme editor ready** — all sections customizable in Shopify admin

## Design

| Element | Choice |
|---------|--------|
| Palette | Deep ink, wine burgundy, antique gold, parchment |
| Typography | Cormorant Garamond (headings), Lora (body), Cinzel (labels) |
| Mood | Literary, nostalgic, mysterious — perfect for blind book dates |

## Preview locally

```bash
cd foley-fable-theme
python3 -m http.server 8090
```

Open [http://localhost:8090/preview.html](http://localhost:8090/preview.html) to see the static design preview.

## Deploy to Shopify

### Option 1: Upload ZIP (easiest)

1. Zip the `foley-fable-theme` folder contents (not the folder itself):
   ```bash
   cd foley-fable-theme
   zip -r ../foley-fable-theme.zip .
   ```
2. In Shopify Admin → **Online Store** → **Themes**
3. Click **Add theme** → **Upload zip file**
4. Select `foley-fable-theme.zip`
5. Click **Publish** when ready

### Option 2: Shopify CLI (for ongoing development)

```bash
npm install -g @shopify/cli @shopify/theme
cd foley-fable-theme
shopify theme dev --store uan0ex-bp.myshopify.com
```

When satisfied:
```bash
shopify theme push --store uan0ex-bp.myshopify.com
```

## Email checkout

Shoppers add dates to their cart and send a request to **slashleyx06@gmail.com**. Ashley replies to confirm, arrange payment, and close the sale. No card is charged on the site.

The live preview uses this flow today:
**https://alexdepasquale2-jpg.github.io/effective-broccoli/foley-fable/**

The first request activates FormSubmit — open the confirmation email sent to `slashleyx06@gmail.com` and click activate. After that, every request lands in the inbox. If the web form is blocked, the page falls back to the customer’s email app.

## After installing

1. **Set up navigation** — Admin → Online Store → Navigation:
   - Create a **Main menu** with: Shop (`/collections/all`), How It Works (`/#how-it-works`), Our Story (`/pages/about`)
   - Create a **Footer menu** with policy links

2. **Customize in theme editor** — Online Store → Themes → Customize:
   - Upload a hero background image (stacked books, candlelight, vintage library)
   - Upload a brand story image
   - Set the featured collection to "All"
   - Add your Instagram URL and contact email in the footer

3. **Create an About page** — Admin → Online Store → Pages → Add page titled "About"

4. **Add product photos** — The theme looks best with moody, atmospheric product photography

## Theme structure

```
foley-fable-theme/
├── assets/          CSS, JavaScript
├── config/          Theme settings
├── layout/          theme.liquid (global wrapper)
├── locales/         English translations
├── sections/        Homepage & page sections
├── snippets/        Reusable components
└── templates/       JSON page templates
```

## Sections available in theme editor

| Section | Use |
|---------|-----|
| Hero | Full-screen landing with CTA buttons |
| Featured collection | Product grid from any collection |
| How it works | 3-step ritual explanation |
| Brand story | Split image + text layout |
| Newsletter | Email signup |
| Header / Footer | Navigation, announcement bar, social links |
