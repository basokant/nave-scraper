import { inspect } from "bun";
import { readFile } from "node:fs/promises";

// TODO: make typing less recursive
export type Topic = {
  title: string;
  subtopics: Topic[];
  verses: string[];
  relatedTopics: string[];
};

if (import.meta.main) {
  const topics = await parse();
  console.log(inspect(topics, { depth: 4 }));
}

export async function parse(path = "data/nave.txt"): Promise<Topic[]> {
  const file = await readFile(path);
  const contents = file.toString().replaceAll("<lb/>", "\n");

  const topicSeparator = "$$$";

  const topics = contents
    .split(topicSeparator)
    .map(parseTopic)
    .filter(Boolean) as Topic[];

  return topics;
}

function parseTopic(entry: string): Topic | null {
  const newlineIndex = entry.indexOf("\n");
  const title = entry.slice(0, newlineIndex).trim();
  const body = entry.slice(newlineIndex + 1).trim();

  const defRegex = /<def>\s*([\s\S]*?)<\/def>/;
  const m = body.match(defRegex);
  const def = m?.[1];

  if (!def) {
    console.error(`couldn't parse def ${title}\n${body}`);
    // TODO: proper error handling here
    return null;
  }

  return parseDefinition(title, def);
}

function parseDefinition(title: string, def: string): Topic {
  // THIS TOOK ME HOURS!
  const headingRegex = /^(→|\d\.|\s?)([^<\n]+)(.*)/gm;
  const matches = [...def.matchAll(headingRegex)];

  // TODO: handle mix of → and 1.
  const headings = matches.map((m) => ({
    symbol: m[1], // → or 1. (or 2., 3., etc.)
    title: m[2].trim(), // text before first <
    text: m[3], // text after first < until the end of the line
  }));

  const subtopics = headings
    .filter((h) => h.title && h.title !== "See")
    .map((h) => ({
      ...parseSubtopic(h.title, h.text),
      symbol: h.symbol,
    }));

  const relatedTopics = headings
    .filter((h) => h.title === "See")
    .map((h) => parseRelatedTopic(h.text))
    .filter(Boolean) as string[];

  return {
    title,
    subtopics: subtopics,
    verses: [], // the parent topic never has verses directly
    relatedTopics: relatedTopics,
  };
}

function parseRelatedTopic(text: string): string | null {
  const relatedTopicRegex = /<ref.*>([^<]+)<\/ref>/;
  const m = text.match(relatedTopicRegex);

  const relatedTopic = m?.[1];

  if (!relatedTopic) {
    console.error(`couldn't parse related topic\n${text}`);
    return null;
  }

  return relatedTopic;
}

function parseVerses(text: string): string[] {
  const osisRefRegex = /<ref osisRef="([^"]*)">/g;
  const matches = [...text.matchAll(osisRefRegex)];

  const verses = matches.map((m) => m[1]);

  return verses;
}

function parseSubtopic(title: string, text: string): Topic {
  const listRegex = /(.*?)<list>(.*?)<\/list>/;
  const m = text.match(listRegex);

  if (!m) {
    return {
      title,
      subtopics: [],
      verses: parseVerses(text),
      relatedTopics: [],
    };
  }

  const versesText = m[1];
  const verses = parseVerses(versesText);

  const listText = m[1];
  const itemRegex = /<item>([^<]*)\h(.*?)<\/item>/g;
  const matches = [...listText.matchAll(itemRegex)];

  const items = matches.map((m) => ({
    title: m[1].trim(),
    text: m[2],
  }));

  const relatedTopics = items
    .filter((i) => i.title === "See")
    .map((i) => parseRelatedTopic(i.text))
    .filter(Boolean) as string[];

  const subtopics = items
    .filter((i) => i.title && i.title !== "See")
    .map((i) => parseItem(i.title, i.text));

  return {
    title,
    subtopics,
    verses,
    relatedTopics,
  };
}

function parseItem(title: string, text: string): Topic {
  const verses = parseVerses(text);
  return {
    title,
    subtopics: [],
    verses,
    relatedTopics: [],
  };
}
