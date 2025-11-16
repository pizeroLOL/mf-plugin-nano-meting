const NANO_METING = "https://metingapi.nanorocky.top/";
const buildUrl = (query: NanoMeting.SearchParams) => {
  const url = new URL(NANO_METING);
  Object.entries(query).reduce((acc, [k, v]) => {
    acc.append(k, v);
    return acc;
  }, url.searchParams);
  return url;
};

async function searchByProvider(query: string, server: NanoMeting.Provider) {
  try {
    const iData = await fetch(
      buildUrl({
        server,
        type: "search",
        id: "0",
        keyword: query,
      }),
      {
        headers: {
          Referer:
            query === "netease"
              ? undefined
              : "https://metingapi.nanorocky.top/",
        },
      },
    );
    const i = await iData.json();
    const o = {
      isEnd: true,
      data: (i as NanoMeting.SearchRsp).map((i) => ({
        artist: i.artist,
        title: i.name,
        album: i.album,
        artwork: i.pic,
        url: i.url,
        lrc: i.lrc,
        platform: server,
        id: new URL(i.url).searchParams.get("id"),
      })),
    } as IPlugin.ISearchResult<"music">;
    return o;
  } catch {
    return { isEnd: true, data: [] } as IPlugin.ISearchResult<"music">;
  }
}

async function search<T extends IMedia.SupportMediaType>(
  query: string,
  page: number,
  type: T,
) {
  if (type !== "music") {
    return { isEnd: true, data: [] } as IPlugin.ISearchResult<"music">;
  }
  const [{ data: a }, { data: b }] = await Promise.all([
    searchByProvider(query, "netease"),
    searchByProvider(query, "tencent"),
  ]).catch(() => [
    { isEnd: true, data: [] },
    { isEnd: true, data: [] },
  ]);
  return {
    isEnd: true,
    data: Array.from({ length: Math.max(a.length, b.length) }).reduce(
      (acc: IMusic.IMusicItem, _, i) => {
        if (i < a.length) acc.push(a[i]);
        if (i < b.length) acc.push(b[i]);
        return acc;
      },
      [],
    ),
  } as IPlugin.ISearchResult<"music">;
}

async function getMediaSource(
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey,
): Promise<IPlugin.IMediaSourceResult | null> {
  return {
    ...musicItem,
    headers: {
      Referer: "https://metingapi.nanorocky.top/",
    },
  };
}

export default {
  platform: "nano-meting",
  author: "Pizero",
  // TODO: update
  // srcUrl: "https://example.catcat.work/xxx.js",
  primaryKey: ["id", "platform"],
  cacheControl: "cache",
  version: "0.0.0",
  supportedSearchType: ["music"],
  // TODO: 在这里把插件剩余的功能补充完整
  search,
  getMediaSource,
} as IPlugin.IPluginDefine;
