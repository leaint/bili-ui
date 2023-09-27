import { describe, expect, test, beforeEach, vi } from "vitest";
import {
  ComparableEntity,
  convertIntToString,
  SearcherCacheModel,
  SpaceSearcherAction,
  convertDurationToString,
} from "../src/views/SearchViewScript";
import {
  AllSearchParam,
  SpaceSearchParm,
  BangumiSearchParm,
  UserSearchParm,
} from "../src/stores/interface";
import { APIGen } from "../src/stores/apiv2";

describe("测试SearcherCacheModel", () => {
  class Entity<T> implements ComparableEntity<T> {
    data: T;
    isEqual(t: T): boolean {
      return this.data === t;
    }
    getData(): T {
      return this.data;
    }
    setData(data: any): void {
      this.data = data;
    }
  }
  const cacheStore = new Map<string, any>();

  beforeEach(() => {
    cacheStore.clear();
  });
  test("测试缓存是否有效", () => {
    const number1 = new Entity<number>();
    number1.setData(5);

    const constrain1 = new Entity<boolean>();
    constrain1.setData(true);

    const cacheConfigs = [
      {
        cache: true,
        constrain: false,
        restore: true,
        key: "number1",
        data: number1,
      },
      {
        cache: true,
        constrain: true,
        restore: true,
        key: "constrain1",
        data: constrain1,
      },
    ];
    const cacheModel = new SearcherCacheModel(cacheConfigs, cacheStore);

    expect(cacheModel.isCacheValid()).toBeFalsy();

    cacheModel.saveData();
    expect(cacheModel.isCacheValid()).toBeTruthy();

    constrain1.setData(false);
    expect(cacheModel.isCacheValid()).toBeFalsy();
  });
  test("测试从缓存恢复数据", () => {
    const initNumber = 5;
    const number1 = new Entity<number>();
    number1.setData(initNumber);

    const constrain1 = new Entity<boolean>();
    constrain1.setData(true);

    const cacheConfigs = [
      {
        cache: true,
        constrain: false,
        restore: true,
        key: "number1",
        data: number1,
      },
      {
        cache: true,
        constrain: true,
        restore: false,
        key: "constrain1",
        data: constrain1,
      },
    ];
    const cacheModel = new SearcherCacheModel(cacheConfigs, cacheStore);

    cacheModel.saveData();
    const secondNumber = 99;
    number1.setData(secondNumber);
    cacheModel.restoreData();

    expect(number1.getData()).toEqual(initNumber);
  });
  test("测试配置文件中的restore参数", () => {
    const initNumber = 5;
    const number1 = new Entity<number>();
    number1.setData(initNumber);

    const number2 = new Entity<number>();
    number2.setData(initNumber);

    const constrain1 = new Entity<boolean>();
    constrain1.setData(true);

    const cacheConfigs = [
      {
        cache: true,
        constrain: false,
        restore: true,
        key: "number1",
        data: number1,
      },
      {
        cache: true,
        constrain: false,
        restore: false,
        key: "number2",
        data: number2,
      },
      {
        cache: true,
        constrain: true,
        restore: false,
        key: "constrain1",
        data: constrain1,
      },
    ];
    const cacheModel = new SearcherCacheModel(cacheConfigs, cacheStore);

    cacheModel.saveData();
    const secondNumber = 99;
    number1.setData(secondNumber);
    number2.setData(secondNumber);
    cacheModel.restoreData();

    expect(number1.getData()).toEqual(initNumber);
    expect(number2.getData()).toEqual(secondNumber);
  });
});
import res from "./data/spacedata.json";

describe("测试SearcherAction", () => {
  const store = {
    cookie: "",
    apiprefix: "",
    uid: "",
    vapiprefix: "",
  };

  class TestApiGen extends APIGen {
    doFetch(
      apiType: string,
      param: Record<string, any>,
      headers?: Headers
    ): Promise<any> {
      return Promise.resolve(res);
    }
  }

  const myAPIGen = new TestApiGen(new Headers(), store);

  test("SpaceSearcherAction", async () => {
    const spaceSearcherAction = new SpaceSearcherAction(myAPIGen);

    const param: SpaceSearchParm = {
      keyword: "",
      page: 0,
      order: "click",
      mid: 0,
    };
    const { results, numPages } = await spaceSearcherAction.search(param);

    expect(results.length).toEqual(3);
  });
});

describe("测试工具函数", () => {
  test("convertIntToString", () => {
    expect(convertIntToString(1_000)).toEqual("1000");
    expect(convertIntToString(10_000)).toEqual("1万");
  });
  test("convertDurationToString", () => {
    expect(convertDurationToString("61:21")).toEqual("1:01:21");
    expect(convertDurationToString("45:23")).toEqual("45:23");
  });
});
