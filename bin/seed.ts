import { scrape, type Topic } from "./scrape.ts";
import { db as database } from "../src/db/index.ts";
import { topic, topicHierarchy, topicVerse } from "../src/db/schema.ts";
import { eq } from "drizzle-orm";

if (import.meta.main) {
  await seed();
}

type FlatTopic = Omit<Topic, "subtopics"> & { parentTitle: string | null };

function flattenTopics(
  topics: Topic[],
  parentTitle: string | null = null,
): FlatTopic[] {
  return topics.flatMap((topic) => {
    const current: FlatTopic = {
      title: topic.title,
      parentTitle,
      verses: topic.verses,
      relatedTopics: topic.relatedTopics,
    };

    const children = flattenTopics(topic.subtopics, topic.title);
    return [current, ...children];
  });
}

async function seed(db = database, topics?: Topic[]) {
  const scrapedData = topics ?? (await scrape());
  const data = flattenTopics(scrapedData);

  await db.transaction(async (tx) => {
    for (const t of data) {
      const res = await tx
        .insert(topic)
        .values({ title: t.title })
        .returning({ id: topic.id });
      const id = res[0].id;

      const parent = t.parentTitle
        ? await tx.query.topic.findFirst({
            columns: { id: true },
            where: eq(topic.title, t.parentTitle),
          })
        : null;

      tx.insert(topicHierarchy).values({ id, parentId: parent?.id });
      tx.insert(topicVerse).values(
        t.verses.map((v) => ({ topicId: id, ref: v })),
      );

      // TODO: insert relatedTopic
    }
  });
}
