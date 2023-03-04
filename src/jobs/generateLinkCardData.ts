import path, { extname, join } from "path";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { extractLinkCardData, parseMdToMdast } from "../utils/markdown";
import { fetchSEOData } from "../utils/headlessBrowser";

const CONTENT_DIR = "./contents"
const OUTPUT_DIR = "./public"

const OGP_IMG_DIR_PATH = path.join(OUTPUT_DIR, "ogp");
await rm(OGP_IMG_DIR_PATH, { recursive: true, force: true });
await mkdir(OGP_IMG_DIR_PATH, { recursive: true });


const articles = await readdir(CONTENT_DIR);
console.log(articles)
const fetchLinkPromimse = articles
  .filter((filename) => {
    return extname(filename) === ".md";
  })
  .map(async (filename): Promise<{ filename: string; links: string[] }> => {
    const content = await readFile(join(CONTENT_DIR, filename));
    const root = parseMdToMdast(content.toString());
    const links = extractLinkCardData(root);
    return {
      filename,
      links,
    };
  });

const linkCardData = (await Promise.allSettled(fetchLinkPromimse))
  .map((result) => {
    return result.status === "fulfilled" ? result.value : undefined;
  })
  .filter((d) => d);

console.log(linkCardData)

const promises = linkCardData.map(async (data) => {
  const seoData = await fetchSEOData(data?.links || []);
  return {
    filename: data?.filename,
    seoData,
  };
});

const result = await Promise.allSettled(promises);

const METADATA_DIR_PATH = path.join("src", "metadata");
await rm(METADATA_DIR_PATH, { recursive: true, force: true });
await mkdir(METADATA_DIR_PATH, { recursive: true });

const allSEOData = result.reduce((prev, data) => {
  if (data.status === "rejected" || data.value.filename === undefined) return prev;

  return [
    ...data.value.seoData,
    ...prev
  ]
}, [] as {
  title: string,
  description: string,
  ogpURL: string
}[])

await writeFile(
  path.join(METADATA_DIR_PATH, `seo-data.json`),
  JSON.stringify(allSEOData)
);
