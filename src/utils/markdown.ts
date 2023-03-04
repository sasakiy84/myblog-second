import { fromMarkdown } from "mdast-util-from-markdown";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { frontmatter } from "micromark-extension-frontmatter";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { Root, FrontmatterContent } from "mdast";
import { parse } from "yaml";
import { visit } from "unist-util-visit";

export const parseMdToMdast = (markdown: string): Root => {
  return fromMarkdown(markdown, {
    extensions: [gfm(), frontmatter(["yaml"])],
    mdastExtensions: [gfmFromMarkdown(), frontmatterFromMarkdown(["yaml"])],
  });
};

export const extractMetaData = (root: Root) => {
  const frontMatter = root.children.filter(
    (node) => node.type === "yaml"
  )[0] as FrontmatterContent;
  const metaData = parse(frontMatter.value);
  return metaData;
};

export const extractLinkCardData = (root: Root): string[] => {
  const links = new Set<string>();
  visit(root, "link", (node) => {
    if (node.position?.start.column !== 1) return;
    links.add(node.url);
  });
  return Array.from(links);
};
