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

  const defRegex = /<def>\s*(.*)\s*<\/def>/;
  const m = body.match(defRegex);
  const def = m?.at(0);

  if (!def) {
    // TODO: proper error handling here
    return null;
  }

  return parseDefinition(title, def);
}

function parseDefinition(title: string, def: string): Topic {
  // TODO: get all parent subtopic sections
  // TODO: handle "See" headings
  const subtopicRegex = /^(→|\d\.)?\h?([^<]+)\h(.*)/gm;

  return {
    title,
  };
}
