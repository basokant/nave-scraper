import { readFile } from "node:fs/promises";

export type Topic = {
  title: string;
  subtopics: Topic[];
  verses: string[];
  relatedTopics: string[];
};

if (import.meta.main) {
  const topics = await parse();
  console.log(topics);
}

export async function parse(path = "data/nave.txt"): Promise<Topic[]> {
  const file = await readFile(path);
  const contents = file.toString().replaceAll("<lb/>", "\n");

  const topicSeparator = "$$$";

  const topics = contents
    .split(topicSeparator)
    .filter(Boolean)
    .map(parseTopic)
    .filter(Boolean) as Topic[];

  return topics;
}

function parseTopic(entry: string): Topic | null {
  const newlineIndex = entry.indexOf("\n");
  const title = entry.slice(0, newlineIndex).trim();
  const body = entry.slice(newlineIndex + 1).trim();

  const defRegex = /<def>\h*(.*)\h*<\/def>/;
  const m = body.match(defRegex);
  const def = m?.at(0);

  if (!def) {
    // TODO: proper error handling here
    return null;
  }

  return parseDefinition(title, def);
}

function parseDefinition(title: string, def: string): Topic {
  // THIS TOOK ME HOURS!
  const headingRegex = /^(→|\d\.)?([^<]+)?(.*)/gm;
  const matches = [...def.matchAll(headingRegex)];

  // TODO: handle mix of → and 1.
  const headings = matches.map((m) => ({
    symbol: m[0], // → or 1. (or 2., 3., etc.)
    title: m[1].trim(), // text before first <
    text: m[2], // text after first < until the end of the line
  }));

  const subtopics = headings
    .filter((h) => h.title !== "See")
    .map((h) => ({
      ...parseSubtopic(h.title, h.text),
      symbol: h.symbol,
    }));

  const relatedTopics = headings
    .filter((h) => h.title === "See")
    .map((h) => parseRelatedTopic(h.text));

  return {
    title,
    subtopics: subtopics,
    verses: [],
    relatedTopics: relatedTopics,
  };
}

function parseRelatedTopic(text: string): string {
  // TODO
  return text;
}

function parseSubtopic(title: string, text: string): Topic {
  // TODO
  return {
    title,
    subtopics: [],
    verses: [],
    relatedTopics: [],
  };
}
