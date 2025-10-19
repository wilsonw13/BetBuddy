import fs from "fs";
import path from "path";

const imgDir = path.join(__dirname, "../images");

let defaultBanners: Record<string, string> = {};
let defaultProfilePictures: Record<string, string> = {};

try {
  defaultBanners = JSON.parse(fs.readFileSync(path.join(imgDir, "base64-banner.json"), "utf8"));
  console.log("[defaultImage.ts] Success: Loaded base64-banner.json");
} catch (err) {
  console.error("[defaultImage.ts] Error: Could not load base64-banner.json:", err);
}

try {
  defaultProfilePictures = JSON.parse(fs.readFileSync(path.join(imgDir, "base64-pfp.json"), "utf8"));
  console.log("[defaultImage.ts] Success: Loaded base64-pfp.json");
} catch (err) {
  console.error("[defaultImage.ts] Error: Could not load base64-pfp.json:", err);
}

export { defaultBanners, defaultProfilePictures };

/**
 * Returns a random base64 profile picture string from defaultProfilePictures.
 */
export function getRandomProfilePicture(): string | null {
  const keys = Object.keys(defaultProfilePictures);
  if (keys.length === 0) return null;
  const idx = Math.floor(Math.random() * keys.length);
  return defaultProfilePictures[keys[idx]];
}

/**
 * Returns a random base64 banner string from defaultBanners.
 */
export function getRandomBanner(): string | null {
  const keys = Object.keys(defaultBanners);
  if (keys.length === 0) return null;
  const idx = Math.floor(Math.random() * keys.length);
  return defaultBanners[keys[idx]];
}

// only if the file is executed directly, not imported
if (require.main === module) {
  let files: string[] = [];
  try {
    files = fs.readdirSync(imgDir).filter((f) => /\.(jpg|png|jpeg)$/i.test(f));
  } catch (err) {
    console.error(`[defaultImage.ts] Error: Could not read directory ${imgDir}:`, err);
    process.exit(1);
  }

  const prefixMap: Record<string, Record<string, string>> = {};

  files.forEach((file) => {
    const prefix = file.split("-")[0] || "other";
    if (!prefixMap[prefix]) prefixMap[prefix] = {};
    try {
      const data = fs.readFileSync(path.join(imgDir, file));
      prefixMap[prefix][file] = data.toString("base64");
    } catch (err) {
      console.error(`[defaultImage.ts] Error: Could not read file ${file}:`, err);
    }
  });

  Object.entries(prefixMap).forEach(([prefix, obj]) => {
    const outFile = path.join(imgDir, `base64-${prefix}.json`);
    try {
      fs.writeFileSync(outFile, JSON.stringify(obj, null, 2));
      console.log(`[defaultImage.ts] Success: Wrote ${outFile}`);
    } catch (err) {
      console.error(`[defaultImage.ts] Error: Could not write file ${outFile}:`, err);
    }
  });
}
