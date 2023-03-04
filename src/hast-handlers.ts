import { readFile } from "fs/promises"
import { Text } from "mdast-util-from-markdown/lib"
import { Handler } from "mdast-util-to-hast"
import path from "path"
import { createStarryNight, all } from '@wooorm/starry-night'
import type { ElementContent } from "hast"

export const inlineCodeHandler: Handler = (_state, node) => {
  const text: Text = { type: 'text', value: node.value.replace(/\r?\n|\r/g, ' ') }
  return {
    type: "element",
    tagName: "inline-code",
    properties: {},
    children: [text]
  }
}

const starryNight = await createStarryNight(all)
export const codeBlockHandler: Handler = (_state, node) => {
  const scope = starryNight.flagToScope(node.lang ?? "");
  if (scope === undefined) return {
    tagName: "pre",
    type: "element",
    properties: {
      class: "highlight"
    },
    children: [
      {
        type: "text",
        value: node.value
      }
    ]
  };
  const fragment: ElementContent[] = starryNight.highlight(node.value, scope).children.map(n => {
    if (n.type !== "doctype") return n

    return {
      type: "comment",
      value: "node type 'DocType' is not supported"
    }
  })

  return {
    tagName: "pre",
    type: "element",
    properties: {
      class: ['highlight',
        'highlight-' + scope.replace(/^source\./, '').replace(/\./g, '-')]
    },
    children: fragment
  }
}


const data = await readFile(path.join("src", "metadata", "seo-data.json"), { encoding: "utf-8" })
const linkMetaData: {
  url: string,
  title: string,
  description: string,
  ogpURL: string
}[] = JSON.parse(data)
export const linkHandler: Handler = (state, node) => {
  const meta = linkMetaData.find(v => v.url === node.url)

  // ogp が無かったら普通のリンクにする
  if (meta === undefined || meta.ogpURL === "") {
    return {
      type: "element",
      tagName: "a",
      properties: {
        href: node.url,
        target: "_blank"
      },
      children: state.all(node)
    }
  }

  return {
    type: "element",
    tagName: "a-card",
    properties: {
      href: node.url,
      title: meta?.title || node.url,
      description: meta?.description,
      "ogp-url": meta?.ogpURL
    },
    children: state.all(node)
  }
}