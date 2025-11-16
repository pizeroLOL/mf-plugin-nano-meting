const NANO_METING = "https://metingapi.nanorocky.top/";
const ORIGIN = "https://musicfree.catcat.work";
const REFERER = "https://musicfree.catcat.work/";
const UA = "MusicFree_Client";
const HEADERS = {
  Referer: REFERER,
  Origin: ORIGIN,
  "User-Agent": UA,
};

const buildHeader = () => ({
  ...HEADERS,
  USERK: (() => {
    try {
      env.getUserVariables()["user_key"];
    } catch {
      return undefined;
    }
  })(),
});

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
        headers: buildHeader(),
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
      (acc: IMusic.IMusicItem[], _, i) => {
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
    headers: buildHeader(),
  };
}

async function getLyric(
  musicItem: IMusic.IMusicItemPartial,
): Promise<ILyric.ILyricSource | null> {
  if (!musicItem.id || !musicItem.lrc) {
    return null;
  }
  try {
    const url = musicItem.lrc;
    const translationUrl = new URL(url);
    translationUrl.searchParams.set("trlrc", "only");
    const rawLyricReq = await fetch(url, {
      headers: buildHeader(),
    });
    const rawLrc = await rawLyricReq.text();
    const translationReq = await fetch(translationUrl, {
      headers: buildHeader(),
    });
    const translation = await translationReq.text();
    return {
      rawLrc,
      translation,
    };
  } catch {
    return null;
  }
}

export default {
  platform: "nano-meting",
  author: "Pizero",
  appVersion: ">0.1.2-alpha.0",
  // TODO: update
  // srcUrl: "https://example.catcat.work/xxx.js",
  primaryKey: ["id", "platform"],
  userVariables: [{ key: "user_key", title: "用户密钥" }],
  cacheControl: "cache",
  version: "0.0.0",
  supportedSearchType: ["music"],
  // TODO: 在这里把插件剩余的功能补充完整
  search,
  getMediaSource,
  getLyric,
} as IPlugin.IPluginDefine;
