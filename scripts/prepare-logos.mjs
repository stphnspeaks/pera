// Turns the original bank logo files in assets/bank-logos into uniform 256x256 tiles in public/logos
// (named after the preset key). The app clips each tile to a circle, so every logo is fitted to sit
// inside the circle. Run with: npm run logos
//
// modes
//   cover:  the file is full-bleed artwork with the logo centered (corners are just background)
//   circle: the logo itself is round; trim it and fill the tile (scale = fraction of the tile)
//   pad:    wide or square logo on a plain background; trimmed and centered so its diagonal fits the circle
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "assets", "bank-logos");
const outDir = join(root, "public", "logos");
mkdirSync(outDir, { recursive: true });
const SIZE = 256;
const FIT_DIAGONAL = 0.8; // logo diagonal as a fraction of the tile (circle inscribes 1.0)

const JOBS = {
  metrobank: { file: "Metrobank.jpg", mode: "pad", bg: "#ffffff" },
  unionbank: { file: "unionbank.jpg", mode: "cover" },
  landbank: { file: "landbank.jpg", mode: "circle", bg: "#ffffff", scale: 0.84 },
  securitybank: { file: "security bank.jpg", mode: "pad" },
  pnb: { file: "pnb.png", mode: "pad", bg: "#ffffff", diagonal: 0.86 },
  rcbc: { file: "rcbc.png", mode: "pad", bg: "#ffffff", flatten: "#ffffff" },
  maribank: { file: "maribank.jpg", mode: "circle", bg: "#ffffff", scale: 0.8 },
  gotyme: { file: "gotyme.jpg", mode: "pad" },
  cimb: { file: "cimb.png", mode: "circle", bg: "#790007", flatten: "#790007", scale: 1 },
  tonik: { file: "tonik.png", mode: "circle", scale: 1 },
  gcash: { file: "gcash.png", mode: "pad" },
  maya: { file: "maya.png", mode: "trim-cover" },
};

const corner = async (input) => {
  const { data } = await sharp(input)
    .removeAlpha()
    .extract({ left: 2, top: 2, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { r: data[0], g: data[1], b: data[2] };
};

const onCanvas = (bg, logo) =>
  sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: bg } }).composite([
    { input: logo, gravity: "center" },
  ]);

for (const [key, job] of Object.entries(JOBS)) {
  const raw = await sharp(join(srcDir, job.file)).png().toBuffer();
  let out;

  if (job.mode === "cover") {
    out = sharp(raw).resize(SIZE, SIZE, { fit: "cover" });
  } else if (job.mode === "trim-cover") {
    const t = await sharp(raw).trim({ background: "#ffffff", threshold: 40 }).toBuffer();
    out = sharp(t).resize(SIZE, SIZE, { fit: "cover" });
  } else {
    // trim first (alpha logos trim against transparency), then flatten onto a solid color
    let img = sharp(raw).trim({ background: job.bg && !job.flatten ? job.bg : undefined, threshold: 40 });
    let trimmed = await img.png().toBuffer();
    if (job.flatten) trimmed = await sharp(trimmed).flatten({ background: job.flatten }).png().toBuffer();
    const bg = job.bg ?? (await corner(raw));
    if (job.mode === "circle") {
      const box = Math.round(SIZE * job.scale);
      const logo = await sharp(trimmed).resize(box, box, { fit: "inside" }).png().toBuffer();
      const solid = job.bg ?? (await corner(trimmed));
      out = onCanvas(job.bg ?? solid, logo);
    } else {
      const { width, height } = await sharp(trimmed).metadata();
      const diag = Math.hypot(width, height);
      const k = Math.min((SIZE * (job.diagonal ?? FIT_DIAGONAL)) / diag, (SIZE * 0.84) / Math.max(width, height));
      const logo = await sharp(trimmed)
        .resize(Math.round(width * k), Math.round(height * k))
        .png()
        .toBuffer();
      out = onCanvas(bg, logo);
    }
  }
  await out.webp({ quality: 92 }).toFile(join(outDir, `${key}.webp`));
  console.log("logo:", key);
}
console.log("Done:", readdirSync(outDir).join(", "));
