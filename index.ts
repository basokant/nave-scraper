import { inspect } from "util";
import { type HTMLElement, parse } from "node-html-parser";
import { writeFile } from "fs/promises";

/** The maximum concurrent web scrapers */
const MAX_CONCURRENT = 20;

/** The starting page for crawling */
const SEED = "https://www.naves-topical-bible.com";

console.time("scrape");
const queue = await getTopicURLs(SEED);
const visited = new Set<string>();
const workers = Array.from({ length: MAX_CONCURRENT }, () =>
  worker(queue, visited),
);
const res = await Promise.all(workers);
const topics = res.flat();
console.timeEnd("scrape");
console.log(inspect(topics, true, 4, true));

await writeFile("./data.json", JSON.stringify(topics, null, 2), "utf-8");

async function getTopicURLs(seed: string): Promise<string[]> {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");

  const promises = alphabet.map(async (letter) => {
    const res = await fetch(`${seed}/Topics-${letter}.html`);
    return parse(await res.text())
      .querySelectorAll("div#content > li > a")
      .map((el) => el.getAttribute("href"))
      .filter((href) => !!href)
      .map((href) => `${seed}/${href}`);
  });

  const topicURLs = await Promise.all(promises);
  return topicURLs.flat();
}

type Subtopic = {
  title: string;
  verses: string[];
  relatedTopic?: string;
};

type Topic = {
  title: string;
  subtopics: Subtopic[];
  relatedTopic?: string;
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseVerseFromURL(url: string): string {
  const r = /https:\/\/.*\?p=(.*)/; // verseLink url
  return url.match(r)?.[0] ?? "";
}

function parseSubtopic(header: HTMLElement): Subtopic | null {
  const title = header.textContent.trim();
  const ul = header.nextElementSibling;
  let p = header.nextElementSibling;
  let verses: string[] = [];
  // TODO: there can be multiple related topics per (sub)topic...
  let relatedTopic;

  if (ul?.tagName === "UL") {
    verses = ul
      .querySelectorAll("li > a.verseLink")
      .map((a) => a.getAttribute("href") ?? "")
      .map(parseVerseFromURL)
      .filter((a) => a !== "");

    p = ul?.nextElementSibling;
  }

  if (p?.tagName === "P" && p.textContent === "See") {
    relatedTopic = p?.querySelector("a")?.getAttribute("href") ?? "";
  }

  return {
    title,
    verses,
    relatedTopic,
  };
}

function parseTitleFromURL(url: string): string {
  const rawTitle = new URL(url).pathname.slice(1, -5).replaceAll("-", " ");
  return titleCase(rawTitle);
}

async function parseTopicPage(url: string): Promise<Topic> {
  console.time(url);
  const title = parseTitleFromURL(url);

  const res = await fetch(url);
  const document = parse(await res.text());

  const header = document.querySelector("h1");
  const topic = header ? parseSubtopic(header) : null;

  const subtopics: Subtopic[] = document
    .querySelectorAll("h2, h3")
    .map(parseSubtopic)
    .filter((s) => !!s);

  console.timeEnd(url);
  // console.log("Finished parsing", {
  //   url,
  //   title,
  //   numSubtopics: subtopics.length,
  //   relatedTopic: topic?.relatedTopic
  // });

  return {
    title,
    subtopics,
    relatedTopic: topic?.relatedTopic,
  };
}

async function worker(queue: string[], visited: Set<string>): Promise<Topic[]> {
  const topics: Topic[] = [];
  while (queue.length > 0) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);

    try {
      topics.push(await parseTopicPage(url));
    } catch (err) {
      console.error("Error fetching/parsing", url, err);
    }
  }
  return topics;
}
