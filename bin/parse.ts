import { readFile, writeFile } from "node:fs/promises";
import type { Book } from "../src/db/schema";

export type Verse = {
  book: Book;
  ref: string;
};

export type Topic = {
  title: string;
  subtopics: Topic[];
  verses: Verse[];
  relatedTopics: string[];
};

if (import.meta.main) {
  const topics = await parse();
  await writeFile("data/parsed-nave.json", JSON.stringify(topics, null, 2));
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

export function parseTopic(entry: string): Topic | null {
  const newlineIndex = entry.indexOf("\n");
  const title = entry.slice(0, newlineIndex).trim();
  const body = entry.slice(newlineIndex + 1).trim();

  const defRegex = /<def>\s*(?<def>[\s\S]*?)<\/def>/;
  const def = body.match(defRegex)?.groups?.def;

  if (!def) {
    console.warn(`Could not parse def ${title}\n${body}`);
    return null;
  }

  return parseDefinition(title, def);
}

export function parseDefinition(title: string, def: string): Topic {
  // THIS TOOK ME HOURS!
  const headingRegex = /^(?<symbol>→|\d\.|\s?)(?<title>[^<\n]+)(?<text>.*)/gm;
  const matches = def.matchAll(headingRegex);

  const headings = matches
    .map((m) => m?.groups)
    .map((g) => ({
      symbol: g?.symbol ?? "", // → or 1. (or 2., 3., etc.)
      title: g?.title ?? "", // text before first <
      text: g?.text ?? "", // text after first < until the end of the line
    }));

  const subtopics: Topic[] = [];
  const relatedTopics: string[] = [];

  let lastSubtopic: Topic | null = null;
  for (const h of headings) {
    if (h.title && h.title === "See") {
      const relatedTopic = parseRelatedTopic(h.text);
      if (relatedTopic) relatedTopics.push(relatedTopic);
      continue;
    }

    const subtopic = parseSubtopic(h.title, h.text);
    if (lastSubtopic && (h.symbol === "→" || h.symbol === "")) {
      lastSubtopic?.subtopics.push(subtopic);
      continue;
    }

    if (h.symbol !== "→" && h.symbol !== "") {
      lastSubtopic = subtopic;
    }
    subtopics.push(subtopic);
  }

  return {
    title,
    subtopics: subtopics,
    verses: [], // the parent topic never has verses directly
    relatedTopics: relatedTopics,
  };
}

// FIX: not fully parsing related topic (with subtopic)
export function parseRelatedTopic(text: string): string | null {
  const relatedTopicRegex = /<ref.*>(?<relatedTopic>[^<]+)<\/ref>/;
  const relatedTopic = text.match(relatedTopicRegex)?.groups?.relatedTopic;

  if (!relatedTopic) {
    console.warn(`Could not parse related topic\n${text}`);
    return null;
  }

  return relatedTopic;
}

// TODO: parse book and passage separately
export function parseVerses(text: string): Verse[] {
  const osisRefRegex = /<ref osisRef="(?<verse>[^"]*)">/g;

  const verses = text
    .matchAll(osisRefRegex)
    .map((m) => m.groups?.verse ?? "")
    .map((text) => parseVerse(text));

  return verses.toArray();
}

const osisBookMap: Record<string, Book> = {
  Gen: "Genesis",
  Exod: "Exodus",
  Lev: "Leviticus",
  Num: "Numbers",
  Deut: "Deuteronomy",
  Josh: "Joshua",
  Judg: "Judges",
  Ruth: "Ruth",
  "1Sam": "1 Samuel",
  "2Sam": "2 Samuel",
  "1Kgs": "1 Kings",
  "2Kgs": "2 Kings",
  "1Chr": "1 Chronicles",
  "2Chr": "2 Chronicles",
  Ezra: "Ezra",
  Neh: "Nehemiah",
  Esth: "Esther",
  Job: "Job",
  Ps: "Psalms",
  Prov: "Proverbs",
  Eccl: "Ecclesiastes",
  Song: "Song of Solomon",
  Isa: "Isaiah",
  Jer: "Jeremiah",
  Lam: "Lamentations",
  Ezek: "Ezekiel",
  Dan: "Daniel",
  Hos: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obad: "Obadiah",
  Jonah: "Jonah",
  Mic: "Micah",
  Nah: "Nahum",
  Hab: "Habakkuk",
  Zeph: "Zephaniah",
  Hag: "Haggai",
  Zech: "Zechariah",
  Mal: "Malachi",
  Matt: "Matthew",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Rom: "Romans",
  "1Cor": "1 Corinthians",
  "2Cor": "2 Corinthians",
  Gal: "Galatians",
  Eph: "Ephesians",
  Phil: "Philippians",
  Col: "Colossians",
  "1Thess": "1 Thessalonians",
  "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy",
  "2Tim": "2 Timothy",
  Titus: "Titus",
  Phlm: "Philemon",
  Heb: "Hebrews",
  Jas: "James",
  "1Pet": "1 Peter",
  "2Pet": "2 Peter",
  "1John": "1 John",
  "2John": "2 John",
  "3John": "3 John",
  Jude: "Jude",
  Rev: "Revelation",
};

export function parseVerse(text: string, bookMap = osisBookMap): Verse {
  const refRegex =
    /(?<book>\w+)\.(?<ref1>[^-]+)-?(?:\k<book>.)?(?<ref2>[^-]+)?/;
  const groups = text.match(refRegex)?.groups;

  const book = bookMap[groups?.book ?? ""];
  const ref1 = groups?.ref1?.replace(".", ":");
  const ref2 = groups?.ref2?.replace(".", ":");

  if (!book || !ref1) {
    throw Error(`Could not parse verse ref.\n${text}`);
  }

  const ref = !!ref2 ? `${ref1}-${ref2}` : ref1;

  return {
    book,
    ref,
  };
}

export function parseSubtopic(title: string, text: string): Topic {
  const listRegex = /(?<versesText>.*?)<list>(?<listText>.*?)<\/list>/;
  const m = text.match(listRegex);

  if (!m) {
    return {
      title,
      subtopics: [],
      verses: parseVerses(text),
      relatedTopics: [],
    };
  }

  const versesText = m.groups?.versesText ?? "";
  const verses = parseVerses(versesText);

  const listText = m.groups?.listText ?? "";

  const itemRegex = /<item>(?<title>[^<]*)(?<text>.*?)<\/item>/g;
  const matches = listText.matchAll(itemRegex);

  const items = matches
    .map((m) => ({
      title: m.groups?.title.trim() ?? "",
      text: m.groups?.text.trim() ?? "",
    }))
    .toArray();

  const relatedTopics = items
    .values()
    .filter((i) => !!i.title && i.title === "See")
    .map((i) => parseRelatedTopic(i.text))
    .toArray() as string[];

  const subtopics = items
    .values()
    .filter((i) => !!i.title && i.title !== "See")
    .map((i) => parseItem(i.title, i.text))
    .toArray();

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
