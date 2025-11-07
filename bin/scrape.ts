import { writeFile } from "node:fs/promises";
import { type HTMLElement, parse } from "node-html-parser";

const MAX_CONCURRENT = 20;
const SEED_URL = "https://www.naves-topical-bible.com";

if (import.meta.main) {
  const topics = await scrape();
  await writeFile("data.json", JSON.stringify(topics));
}

export async function scrape(
  num_workers = MAX_CONCURRENT,
  seed_url = SEED_URL,
): Promise<Topic[]> {
  console.time("scrape");
  const queue = await getTopicURLs(seed_url);
  const visited = new Set<string>();
  const workers = Array.from({ length: num_workers }, () =>
    worker(queue, visited),
  );
  const res = await Promise.all(workers);
  const topics = res.flat().sort((a, b) => a.title.localeCompare(b.title));

  console.timeEnd("scrape");
  return topics;
}

async function getTopicURLs(seed_url: string): Promise<string[]> {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");

  const promises = alphabet.map(async (letter) => {
    const res = await fetch(`${seed_url}/Topics-${letter}.html`);
    return parse(await res.text())
      .querySelectorAll("div#content > li > a")
      .map((el) => el.getAttribute("href"))
      .filter(Boolean)
      .map((href) => `${seed_url}/${href}`);
  });

  const topicURLs = await Promise.all(promises);
  return topicURLs.flat();
}

export type Topic = {
  title: string;
  subtopics: Topic[];
  verses: string[];
  relatedTopics: string[];
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseReferences(refs: string[]): string[] {
  const results: string[] = [];
  let currentBook = "";

  const pattern = /^(?:(?<book>[1-3]?\s?[A-Za-z]+)\s*)?(?<rest>[\d:,\-–]+)$/;

  for (const ref of refs) {
    const m = ref.match(pattern);
    if (!m || !m.groups) continue;

    const { book, rest } = m.groups;
    if (book) currentBook = book;

    results.push(`${currentBook} ${rest}`);
  }

  return results;
}

function parseRelatedTopic(s: string): string | null {
  const pattern = /^See\s+(?<relatedTopic>.+)$/;
  const m = s.match(pattern);
  if (!m || !m?.groups) return null;

  const { relatedTopic } = m.groups;
  return titleCase(relatedTopic ?? ""); // FIXME: weird type bug
}

function isHeading(el: HTMLElement | null): boolean {
  if (!el) return false;
  return /^H[1-6]$/i.test(el.tagName);
}

function getHeadingLevel(el: HTMLElement): number {
  const m = el.tagName.match(/^H([1-6])$/i);
  return m ? Number(m[1]) : 7;
}

function isSubHeadingOf(parent: HTMLElement, child: HTMLElement): boolean {
  return getHeadingLevel(child) > getHeadingLevel(parent);
}

type ParseTopicResult = {
  topic: Topic;
  endEl: HTMLElement | null;
};

function parseTopic(el: HTMLElement): ParseTopicResult {
  const title = titleCase(el.textContent.trim());
  const verses: string[] = [];
  const relatedTopics: string[] = [];
  const subtopics: Topic[] = [];

  let cur = el.nextElementSibling;

  // Collect verses immediately following the header
  if (cur?.tagName === "UL") {
    const refs = cur
      .querySelectorAll("li > span.versetag")
      .map((el) => el.textContent)
      .flatMap((s) => s.split("; "))
      .map((s) => s.trim())
      .filter((s) => !!s && !Number(s));

    verses.push(...parseReferences(refs));
    cur = cur.nextElementSibling;
  }

  // Collect related topics
  while (cur?.tagName === "P" && cur.textContent.trim().startsWith("See")) {
    const relatedTopic = parseRelatedTopic(cur?.textContent);
    if (relatedTopic) relatedTopics.push(relatedTopic);
    cur = cur.nextElementSibling;
  }

  // Collect nested subtopics until next sibling/parent topic
  while (cur) {
    if (!isHeading(cur)) {
      cur = cur.nextElementSibling;
      continue;
    }

    if (!isSubHeadingOf(el, cur)) break;

    const { topic: subtopic, endEl } = parseTopic(cur);
    if (
      subtopic.verses.length ||
      subtopic.relatedTopics.length ||
      subtopic.subtopics.length
    ) {
      subtopics.push(subtopic);
    }
    cur = endEl;
  }

  const topic = {
    title,
    verses,
    relatedTopics,
    subtopics,
  };
  return {
    topic,
    endEl: cur,
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
  const parsedRes = header ? parseTopic(header) : null;

  if (!parsedRes) {
    throw Error(`Couldn't find header element on topic page ${url}`);
  }

  console.timeEnd(url);

  return {
    ...parsedRes.topic,
    title,
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
      console.error("Error fetching/parsing", err);
    }
  }
  return topics;
}
