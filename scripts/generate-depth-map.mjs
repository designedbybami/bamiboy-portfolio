// One-time dev tool: generates a grayscale depth map per work image for the SpatialImage hover shader.
// Usage: node scripts/generate-depth-map.mjs <input.jpg> [<input2.jpg> ...]
// Re-run per image whenever a placeholder is swapped for a real case-study screenshot.
import { pipeline } from "@huggingface/transformers";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const MODEL = "onnx-community/depth-anything-v2-small";
const OUT_DIR = "public/images/works/depth";

async function main() {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error("Usage: node scripts/generate-depth-map.mjs <input.jpg> [...]");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Loading ${MODEL}...`);
  const estimateDepth = await pipeline("depth-estimation", MODEL);

  for (const input of inputs) {
    const name = path.parse(input).name;
    const outPath = path.join(OUT_DIR, `${name}.png`);
    console.log(`Estimating depth: ${input}`);
    const { depth } = await estimateDepth(path.resolve(input));
    await depth.save(outPath);
    console.log(`  -> ${outPath}`);
  }
}

main();
