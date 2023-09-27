import { describe, expect, test } from "vitest";
import { crop, genPageFunc } from "../src/stores/lib";

describe("generate page list", () => {
  test("1/50", async () => {
    const { pages, le, re } = genPageFunc(50, 1);

    expect(pages).toEqual([2, 3, 4, 5, 6]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });
  test("2/50", async () => {
    const { pages, le, re } = genPageFunc(50, 2);

    expect(pages).toEqual([2, 3, 4, 5, 6]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });
  test("4/50", async () => {
    const { pages, le, re } = genPageFunc(50, 4);

    expect(pages).toEqual([2, 3, 4, 5, 6]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });

  test("5/50", async () => {
    const { pages, le, re } = genPageFunc(50, 5);

    expect(pages).toEqual([3, 4, 5, 6, 7]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });
  test("6/50", async () => {
    const { pages, le, re } = genPageFunc(50, 6);

    expect(pages).toEqual([4, 5, 6, 7, 8]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });
  test("10/50", async () => {
    const { pages, le, re } = genPageFunc(50, 10);

    expect(pages).toEqual([8, 9, 10, 11, 12]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });

  test("46/50", async () => {
    const { pages, le, re } = genPageFunc(50, 46);

    expect(pages).toEqual([44, 45, 46, 47, 48]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });
  test("47/50", async () => {
    const { pages, le, re } = genPageFunc(50, 47);

    expect(pages).toEqual([45, 46, 47, 48, 49]);

    expect(le).toBeTruthy();
    expect(re).toBeFalsy();
  });
  test("48/50", async () => {
    const { pages, le, re } = genPageFunc(50, 48);

    expect(pages).toEqual([46, 47, 48, 49]);

    expect(le).toBeTruthy();
    expect(re).toBeFalsy();
  });
  test("49/50", async () => {
    const { pages, le, re } = genPageFunc(50, 49);

    expect(pages).toEqual([47, 48, 49]);

    expect(le).toBeTruthy();
    expect(re).toBeFalsy();
  });
  test("50/50", async () => {
    const { pages, le, re } = genPageFunc(50, 50);

    expect(pages).toEqual([48, 49]);

    expect(le).toBeTruthy();
    expect(re).toBeFalsy();
  });

  test("10/50, 7个页码项", async () => {
    const { pages, le, re } = genPageFunc(50, 10, 7);

    expect(pages).toEqual([7, 8, 9, 10, 11, 12, 13]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });

  test("10/50, 8个页码项", async () => {
    const { pages, le, re } = genPageFunc(50, 10, 8);

    expect(pages).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });

  test("6/50, 8个页码项", async () => {
    const { pages, le, re } = genPageFunc(50, 6, 8);

    expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });

  test("6/0", async () => {
    const { pages, le, re } = genPageFunc(0, 6);

    expect(pages).toEqual([]);

    expect(le).toBeFalsy();
    expect(re).toBeFalsy();
  });
  test("2/9，11个页码", async () => {
    const { pages, le, re } = genPageFunc(9, 2, 11);

    expect(pages).toEqual([2, 3, 4, 5, 6, 7, 8]);

    expect(le).toBeFalsy();
    expect(re).toBeFalsy();
  });
  test("1/1，11个页码", async () => {
    const { pages, le, re } = genPageFunc(1, 1, 11);

    expect(pages).toEqual([]);

    expect(le).toBeFalsy();
    expect(re).toBeFalsy();
  });
  test("0/1", async () => {
    const { pages, le, re } = genPageFunc(1, 0);

    expect(pages).toEqual([]);

    expect(le).toBeFalsy();
    expect(re).toBeFalsy();
  });

  test("1/20，3个页码", async () => {
    const { pages, le, re } = genPageFunc(20, 1, 3);

    expect(pages).toEqual([2, 3, 4]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });
  test("2/20，3个页码", async () => {
    const { pages, le, re } = genPageFunc(20, 2, 3);

    expect(pages).toEqual([2, 3, 4]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });
  test("3/20，3个页码", async () => {
    const { pages, le, re } = genPageFunc(20, 3, 3);

    expect(pages).toEqual([2, 3, 4]);

    expect(le).toBeFalsy();
    expect(re).toBeTruthy();
  });

  test("4/20，3个页码", async () => {
    const { pages, le, re } = genPageFunc(20, 4, 3);

    expect(pages).toEqual([3, 4, 5]);

    expect(le).toBeTruthy();
    expect(re).toBeTruthy();
  });
});

describe("test crop function", () => {
  test("crop 5 in [2, 4]", () => {
    const val = crop(5, 2, 4);
    expect(val).toStrictEqual(4);
  });

  test("crop 1 in [2, 4]", () => {
    const val = crop(1, 2, 4);
    expect(val).toStrictEqual(2);
  });

  test("crop 4 in [2, 4]", () => {
    const val = crop(4, 2, 4);
    expect(val).toStrictEqual(4);
  });

  test("crop 2 in [2, 4]", () => {
    const val = crop(2, 2, 4);
    expect(val).toStrictEqual(2);
  });

  test("crop 3 in [2, 4]", () => {
    const val = crop(3, 2, 4);
    expect(val).toStrictEqual(3);
  });

  test("crop 3 in [4, 2]", () => {
    expect(() => {
      crop(3, 4, 2);
    }).toThrowError("min can't be larger than max, 4 > 2");
  });
});
