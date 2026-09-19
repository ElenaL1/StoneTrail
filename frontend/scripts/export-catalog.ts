import { writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { catalogProducts, featuredMaterials, stoneBlocks } from "../lib/mock-data"

const root = dirname(fileURLToPath(import.meta.url))
const out = resolve(root, "../../backend/seeds/catalog.json")

writeFileSync(
  out,
  `${JSON.stringify(
    {
      materials: featuredMaterials,
      blocks: stoneBlocks,
      products: catalogProducts,
    },
    null,
    2,
  )}\n`,
)
console.log(`Wrote ${out}`)
