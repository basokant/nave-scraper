/** The starting page for crawling */
const seed = "https://www.naves-topical-bible.com";

async function getTopicURLs(seed: string): Promise<string[]> {
  const topicURLs: string[] = [];
  const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");

  const rewriter = new HTMLRewriter().on("div#content > li > a", {
    element: (el) => {
      const href = el.getAttribute("href");
      if (!href) return;

      topicURLs.push(`${seed}/${href}`);
    },
  });

  const promises = alphabet.map(async (letter) => {
    const letterIndexURL = seed + `/Topics-${letter}.html`;
    const res = await fetch(letterIndexURL);
    rewriter.transform(res);
  });
  await Promise.all(promises);

  return topicURLs;
}

const queue = await getTopicURLs(seed);
console.log(queue);
