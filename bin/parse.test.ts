import { describe, test, expect } from "vitest";
import {
  parse,
  parseSubtopic,
  parseVerse,
  parseVerses,
  type Topic,
  type Verse,
} from "./parse.ts";

describe("parse verse", () => {
  test("single verse reference", () => {
    const text = "1Sam.18.19";

    const got = parseVerse(text);
    const want: Verse = {
      book: "1 Samuel",
      ref: "18:19",
    };
    expect(got).toEqual(want);
  });

  test("multiple verses reference", () => {
    const text = "Job.33.14-Job.33.30";

    const got = parseVerse(text);
    const want: Verse = {
      book: "Job",
      ref: "33:14-33:30",
    };
    expect(got).toEqual(want);
  });

  test("just a chapter", () => {
    const text = "Matt.6";

    const got = parseVerse(text);
    const want: Verse = {
      book: "Matthew",
      ref: "6",
    };
    expect(got).toEqual(want);
  });
});

describe("parse verses", () => {
  test("single reference", () => {
    const text = '<ref osisRef="Luke.3.23-Luke.3.38">Lu 3:23-38</ref>';

    const got = parseVerses(text);
    const want: Verse[] = [{ book: "Luke", ref: "3:23-3:38" }];
    expect(got).toEqual(want);
  });

  test("multiple references", () => {
    const text =
      '<ref osisRef="Ps.34.3">Ps 34:3</ref>; <ref osisRef="Ps.72.17">72:17</ref>;';

    const got = parseVerses(text);
    const want: Verse[] = [
      {
        book: "Psalms",
        ref: "34:3",
      },
      {
        book: "Psalms",
        ref: "72:17",
      },
    ];
    expect(got).toEqual(want);
  });

  test("mix of nave and osis references", () => {
    const text =
      '<ref osisRef="Rev.1.5">Re 1:5</ref>,<ref osisRef="Rev.1.18">18</ref> <list> <item>See <ref target="Nave:RESURRECTION">RESURRECTION</ref>';

    const got = parseVerses(text);
    const want: Verse[] = [
      {
        book: "Revelation",
        ref: "1:5",
      },
      {
        book: "Revelation",
        ref: "1:18",
      },
    ];
    expect(got).toEqual(want);
  });
});

describe("parse subtopic", () => {
  test("with list", () => {
    const text =
      '<list> <item>To Adam <ref osisRef="Gen.3.8-Gen.3.21">Ge 3:8-21</ref></item> <item>To Abraham <ref osisRef="Gen.18.2-Gen.18.33">Ge 18:2-33</ref></item> </list>';

    const got = parseSubtopic("Appearances of", text);
    const want: Topic = {
      title: "Appearances of",
      verses: [],
      subtopics: [
        {
          title: "To Adam",
          verses: [{ book: "Genesis", ref: "3:8-3:21" }],
          subtopics: [],
          relatedTopics: [],
        },
        {
          title: "To Abraham",
          verses: [{ book: "Genesis", ref: "18:2-18:33" }],
          subtopics: [],
          relatedTopics: [],
        },
      ],
      relatedTopics: [],
    };

    expect(got).toEqual(want);
  });
});

describe("parse topics", () => {
  test("does not error", () => {
    expect(parse).not.toThrowError();
  });
});
