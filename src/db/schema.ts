import { relations } from "drizzle-orm/relations";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const topic = sqliteTable("topic", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull().unique(),
});

export const books = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
  // Apocypha
  "Additions to the Book of Esther",
  "Baruch",
  "Bel and the Dragon",
  "Ben Sira",
  "1 Esdras",
  "2 Esdras",
  "Judith",
  "Letter of Jeremiah",
  "1 Maccabees",
  "2 Maccabees",
  "3 Maccabees",
  "4 Maccabees",
  "The Prayer of Azariah",
  "Prayer of Manasseh",
  "Psalm 151",
  "Susanna",
  "Tobit",
  "Wisdom of Solomon",
] as const;

export type Book = (typeof books)[number];

export const topicVerse = sqliteTable(
  "topic_verses",
  {
    topicId: integer()
      .notNull()
      .references(() => topic.id),
    book: text({ enum: books }),

    ref: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.topicId, table.ref] })],
);

export const relatedTopic = sqliteTable(
  "related_topic",
  {
    topicId: integer()
      .notNull()
      .references(() => topic.id),
    relatedId: integer()
      .notNull()
      .references(() => topic.id),
  },
  (table) => [primaryKey({ columns: [table.topicId, table.relatedId] })],
);

export const topicHierarchy = sqliteTable(
  "topic_hierarchy",
  {
    id: integer()
      .notNull()
      .references(() => topic.id),
    parentId: integer().references(() => topic.id),
  },
  (table) => [primaryKey({ columns: [table.id, table.parentId] })],
);

export const topicRelationsDef = relations(topic, ({ many }) => ({
  subtopics: many(topicHierarchy, { relationName: "children" }),
  verses: many(topicVerse),
  related: many(relatedTopic),
}));
