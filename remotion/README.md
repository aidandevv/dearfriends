# Dear Friends desktop promo reel

A minimal, 24-second desktop promo for Dear Friends. It leads with concise product proof: address book, calendar, personal letter composer, private map, and delivery options.

## Composition

`DearFriends-Desktop-Promo-24s` is 1920×1080 at 30fps (732 frames / 24.4 seconds). Its seven scenes are registered separately in Remotion Studio for focused edits:

1. Intro
2. Address book
3. Calendar
4. Composer
5. Map
6. Delivery
7. Closing call to action

The composition uses the app's PP Writer and DM Sans font files and its existing postal-route assets, copied into this project's `public/` directory so rendering stays self-contained.

## Commands

```bash
npm install
npm run dev                         # Remotion Studio
npm run lint                        # ESLint + TypeScript
npm run still                       # Render a late-stage validation frame
npx remotion render DearFriends-Desktop-Promo-30s out/dearfriends-promo.mp4
```

The output directory is ignored by Git. The reel keeps physical-mail claims accurate: Dear Friends prepares labels and letter PDFs, while the owner prints, writes, and stamps physical mail.
