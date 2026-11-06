# Ballpark

A pixel-art daily sports guessing game: five at-bats, one each for NFL, NBA, MLB, men's college basketball and college football. Accuracy earns up to 5,000 points; hits move runners around the field.

## Status

The playable art and gameplay are implemented. The daily delivery, scoring and editorial pipeline are ready. Until a reviewed question schedule is approved, the hosted game explicitly runs in **Practice** mode using the five public demonstration facts. Future questions and answers are never committed here.

## Development

Use Node.js 22. No production dependencies are required.

```sh
npm test
npm run build:site
npm run dev
```

For the local server, configure the server-only variables from `.env.example` in `.env.local`. Supply a signing key of at least 32 characters. The private content tools create the optional compressed bank. Without a bank, the server serves practice. Without a signing key, the API fails closed.

`npm run build` also regenerates `Ballpark-Prototype-3.html`, a standalone offline **practice** export; this generated file is not committed.

## Hosting

Vercel builds the allowlisted `public/` directory with `npm run build:site` and deploys `api/*.js` as Node functions. The repository contains no credentials or unpublished question bank. Production question content is supplied via a server-only Vercel environment variable.

See [daily content workflow](docs/daily-content.md) for review, approval, scheduling and known guest-play limits.

## Artwork and font

Stadium and animation artwork was created through Higgsfield for Ballpark. Pixelify Sans is embedded under the SIL Open Font License; see [font license](PixelifySans-OFL.txt). No additional license is granted for the game source or artwork by making this repository public.
