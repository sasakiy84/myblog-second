import puppeteer from "puppeteer-core";
import { executablePath } from "puppeteer";
import path from "path";

export const fetchSEOData = async (
  targetURLs: string[]
): Promise<
  {
    title: string;
    ogpURL: string;
    description: string;
  }[]
> => {
  console.log("launch browser");
  const browser = await puppeteer.launch({
    executablePath: executablePath(),
    headless: true,
    args: [
      "--no-sandbox",
      // "--single-process",
      // "--no-first-run",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-zygote",
      "--disable-gpu",
    ],
  });
  console.log("launched browser");

  const page = await browser.newPage();
  const pageWidth = 1440
  const viewportHeight = 800

  await page.setViewport({
    width: pageWidth,
    height: viewportHeight
  });
  await page.setRequestInterception(true);
  page.on("request", (interceptedRequest) => {
    if (interceptedRequest.isInterceptResolutionHandled()) return;
    // if (
    //   interceptedRequest.url().endsWith(".png") ||
    //   interceptedRequest.url().endsWith(".jpg") ||
    //   interceptedRequest.url().endsWith(".webp") ||
    //   interceptedRequest.url().endsWith(".css")
    // )
    //   interceptedRequest.abort();
    else interceptedRequest.continue();
  });

  const result: {
    title: string;
    ogpURL: string;
    description: string;
    url: string;
  }[] = [];

  for (const url of targetURLs) {
    if (/^http:\/\/localhost/.test(url)) continue;

    try {
      console.log(`go to page ${url}`);
      await page.goto(url, { timeout: 0, waitUntil: "load" });
      console.log("went to page");
      const titleHandle = await page.$("meta[property='og:title']");
      const ogTitle =
        (
          await page.evaluate((titleElement) => {
            return titleElement?.getAttribute("content");
          }, titleHandle)
        )?.replaceAll("\n", "") || "";
      const title = ogTitle.length === 0 ? ogTitle : await page.title();
      console.log("get title");
      const descriptionHandle = await page.$("meta[property='og:description']");
      const description =
        (
          await page.evaluate((descriptionElement) => {
            return descriptionElement?.getAttribute("content");
          }, descriptionHandle)
        )?.replaceAll("\n", "") || "";
      console.log("get desc");

      descriptionHandle?.dispose();
      const ogpURLHandle = await page.$("meta[property='og:image']");
      const ogpURL =
        (await page.evaluate((ogpElement) => {
          return ogpElement?.getAttribute("content") || "";
        }, ogpURLHandle)) || "";
      ogpURLHandle?.dispose();
      console.log("get ogp");

      const fileBaseName = Buffer.from(url).toString("base64")
      const ogpPath = path.join("public", "ogp", `${fileBaseName}.webp`)
      if (!ogpURL) {
        console.log("caputure screenshot")
        await page.screenshot({
          path: ogpPath
        })
        console.log("caputured screenshot")
      }

      result.push({
        title,
        ogpURL: ogpURL || `/ogp/${fileBaseName}.webp`,
        description,
        url,
      });
    } catch (e) {
      console.log(`fetch ${url} failed`, e);
    }
  }

  await browser.close();

  return result;
};
