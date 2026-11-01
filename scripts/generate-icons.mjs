// Generates the logo, PNG icons, iOS launch images and the web manifest from app.config.json.
// The nest/bird/coin geometry is shared with the app: src/lib/nest-mark.json.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "app.config.json"), "utf8"));
const mark = JSON.parse(readFileSync(join(root, "src/lib/nest-mark.json"), "utf8"));
const pub = join(root, "public");
mkdirSync(join(pub, "icons"), { recursive: true });
mkdirSync(join(pub, "splash"), { recursive: true });

const kebab = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const shape = ({ tag, ...a }) =>
  `<${tag} ${Object.entries(a)
    .map(([k, v]) => `${kebab(k)}="${v}"`)
    .join(" ")}/>`;
const markSvg = () => ["back", "bird", "wing", "coin", "front"].map((p) => mark[p].map(shape).join("")).join("");

/** rx 0 gives a full-bleed square (maskable / apple-touch); scale < 1 keeps the mark in the safe zone. */
const iconSvg = ({ rx = 120, scale = 1 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${rx}" fill="${config.backgroundColor}"/><g transform="translate(256 256) scale(${scale}) translate(-256 -313)">${markSvg()}</g></svg>`;

const splashSvg = (w, h) => {
  const s = Math.round(w * 0.42);
  const sh = (s * 346) / 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${config.backgroundColor}"/>
<svg x="${(w - s) / 2}" y="${h / 2 - sh * 0.75}" width="${s}" height="${sh}" viewBox="56 140 400 346">${markSvg()}</svg>
<text x="${w / 2}" y="${h / 2 + sh * 0.6}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${Math.round(w * 0.1)}" fill="#fff">${config.name}</text>
</svg>`;
};

const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(join(pub, file));

writeFileSync(join(pub, "logo.svg"), iconSvg());
await Promise.all([
  png(iconSvg(), 192, "icons/icon-192.png"),
  png(iconSvg(), 512, "icons/icon-512.png"),
  png(iconSvg({ rx: 0, scale: 0.74 }), 512, "icons/icon-maskable-512.png"),
  png(iconSvg({ rx: 0, scale: 0.9 }), 180, "icons/apple-touch-icon.png"),
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
