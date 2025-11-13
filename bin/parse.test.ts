import { describe, test, expect } from "vitest";
import { parseVerse, parseVerses, type Verse } from "./parse.ts";

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
