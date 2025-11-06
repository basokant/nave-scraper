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

export const topicVerse = sqliteTable(
  "topic_verses",
  {
    topicId: integer()
      .notNull()
      .references(() => topic.id),
    ref: text("verse").notNull(),
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
    parentId: integer()
      .notNull()
      .references(() => topic.id),
    childId: integer()
      .notNull()
      .references(() => topic.id),
  },
  (table) => [primaryKey({ columns: [table.parentId, table.childId] })],
);

export const topicRelationsDef = relations(topic, ({ many }) => ({
  subtopics: many(topicHierarchy, { relationName: "children" }),
  verses: many(topicVerse),
  related: many(relatedTopic),
}));
