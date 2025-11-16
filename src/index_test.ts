import { expect, test } from "bun:test";
import plugin from "./index";
test("search has tencent and netease", async () => {
  const result = await plugin.search("群青", 0, "music");
  expect(result.data.some((i) => i.platform === "netease")).toBe(true);
  expect(result.data.some((i) => i.platform === "tencent")).toBe(true);
});

test("tencent has media", async () => {
  const list = await plugin.search("群青", 0, "music");
  const listItem = list.data[1];
  expect(listItem.platform).toBe("tencent");
  const o = await plugin.getMediaSource({ url: listItem.url }, "standard");
  expect(o.headers["Referer"]).toBe("https://musicfree.catcat.work/");
});
test("tencent has lyric", async () => {
  const list = await plugin.search("群青", 0, "music");
  const listItem = list.data[1];
  expect(listItem.platform).toBe("tencent");
  const o = await plugin.getLyric(listItem);
  expect(o.rawLrc).not.toBeNull();
  expect(o.translation).not.toBeNull();
});
