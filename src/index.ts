import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { toHtml } from "hast-util-to-html";
import { toHast } from "mdast-util-to-hast";
import path from "path";
import { codeBlockHandler, inlineCodeHandler, linkHandler } from "./hast-handlers";
import { extractMetaData, parseMdToMdast } from "./utils/markdown";

const CONTENT_DIR = "./contents"
const OUTPUT_DIR = "./public"

const contentFileNames = await readdir(CONTENT_DIR)
const markdownTexts = await Promise.all(contentFileNames.map((fileName) => {
  return readFile(path.join(CONTENT_DIR, fileName), { encoding: "utf-8" })
}))

const mdasts = markdownTexts.map((text) => parseMdToMdast(text))
const hasts = mdasts.map((mdast, index) => {

  const hast = toHast(mdast, {
    handlers: {
      link: linkHandler,
      inlineCode: inlineCodeHandler,
      code: codeBlockHandler
    }
  })
  const meta = extractMetaData(mdast)
  const fileName = path.basename(contentFileNames[index], path.extname(contentFileNames[index]))
  meta.fileName = fileName
  return {
    hast, meta
  }
})

const htmls = hasts.map(({ hast, meta }) => {
  const html: string = hast
    ? toHtml(hast)
    : ""

  return {
    html, meta
  }
})

const ARTICLE_DIR_PATH = path.join(OUTPUT_DIR, "articles");
await rm(ARTICLE_DIR_PATH, { recursive: true, force: true });
await mkdir(ARTICLE_DIR_PATH, { recursive: true });
const template = await readFile(path.join("src", "views", "template.html"), { encoding: "utf-8" })
await Promise.all(htmls.map(async ({ html, meta }) => {

  const tagsHTML: string = meta.tags?.map((tag: string) => {
    return `<span>${tag}</span>`
  }).join("")

  const embededHTML: string = template
    .replace("{{ content }}", html)
    .replaceAll("{{ title }}", meta.title)
    .replaceAll("{{ description }}", meta.description)
    .replaceAll("{{ tags }}", tagsHTML)

  await mkdir(path.join(ARTICLE_DIR_PATH, meta.fileName), { recursive: true });
  return writeFile(path.join(ARTICLE_DIR_PATH, meta.fileName, "index.html"), embededHTML)
}))

const homeTemplate = await readFile(path.join("src", "views", "home.html"), { encoding: "utf-8" })
const articlesHTML = htmls
  .sort((({ meta: metaA }, { meta: metaB }) => {
    const createdAtA = Date.parse(metaA.createdAt)
    const createdAtB = Date.parse(metaB.createdAt)

    return createdAtB - createdAtA
  }))
  .map(({ meta }) => {

    return `
    <a href="/articles/${meta.fileName}/" class="article-card">
      <p class="title">
        ${meta.title}
      </p>
      <p class="description">
        ${meta.description}
      </p>
    </a>
  `
  }).join("")
await writeFile(path.join(OUTPUT_DIR, "index.html"), homeTemplate.replace("{{ articles }}", articlesHTML))