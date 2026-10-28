// Generates the logo, PNG icons, iOS launch images and the web manifest from app.config.json.
// Keep the mark geometry in sync with src/components/Logo.tsx.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "app.config.json"), "utf8"));
const pub = join(root, "public");
mkdirSync(join(pub, "icons"), { recursive: true });
mkdirSync(join(pub, "splash"), { recursive: true });

const BARS = [
  { x: 124, h: 100 },
  { x: 224, h: 170 },
  { x: 324, h: 250 },
];
const BASE = 396;

const mark = () =>
  BARS.map((b) => `<rect x="${b.x}" y="${BASE - b.h}" width="64" height="${b.h}" rx="22" fill="#fff"/>`).join("") +
  `<circle cx="156" cy="196" r="34" stroke="#fff" stroke-width="16" fill="none"/>`;

const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${config.brandLight}"/><stop offset="1" stop-color="${config.brandDark}"/></linearGradient></defs>`;

/** rx 0 gives a full-bleed square (maskable / apple-touch); scale < 1 keeps the mark in the safe zone. */
const iconSvg = ({ rx = 120, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${gradient}<rect width="512" height="512" rx="${rx}" fill="url(#g)"/><g transform="translate(256 256) scale(${scale}) translate(-256 -271)">${mark()}</g></svg>`;

const splashSvg = (w, h) => {
  const s = Math.round(w * 0.32);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa9ff"/><stop offset="0.55" stop-color="${config.backgroundColor}"/><stop offset="1" stop-color="#0c2262"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<svg x="${(w - s) / 2}" y="${h / 2 - s * 0.7}" width="${s}" height="${s}" viewBox="0 0 512 512">${mark()}</svg>
<text x="${w / 2}" y="${h / 2 + s * 0.55}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${Math.round(w * 0.085)}" fill="#fff">${config.name}</text>
</svg>`;
};

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(join(pub, file));

writeFileSync(join(pub, "logo.svg"), iconSvg());
await Promise.all([
  png(iconSvg(), 192, "icons/icon-192.png"),
  png(iconSvg(), 512, "icons/icon-512.png"),
  png(iconSvg({ rx: 0, scale: 0.72 }), 512, "icons/icon-maskable-512.png"),
  png(iconSvg({ rx: 0, scale: 0.86 }), 180, "icons/apple-touch-icon.png"),
  sharp(Buffer.from(splashSvg(1170, 2532))).png().toFile(join(pub, "splash/iphone13-1170x2532.png")),
  sharp(Buffer.from(splashSvg(1290, 2796))).png().toFile(join(pub, "splash/fallback-1290x2796.png")),
]);

writeFileSync(
  join(pub, "manifest.webmanifest"),
  JSON.stringify(
    {
      name: config.name,
      short_name: config.shortName,
      description: config.description,
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: config.backgroundColor,
      theme_color: config.themeColor,
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  ),
);
console.log("Generated icons, splash images and manifest for", config.name);
