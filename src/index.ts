const NANO_METING = "https://metingapi.nanorocky.top/";
const ORIGIN = "https://musicfree.catcat.work";
const REFERER = "https://musicfree.catcat.work/";
const UA = "MusicFree_Client";
const HEADERS = {
  Referer: REFERER,
  Origin: ORIGIN,
  "User-Agent": UA,
};

function buildHeader() {
  return {
    ...HEADERS,
    USERK: (() => {
      try {
        return env.getUserVariables()["user_key"];
      } catch {
        return undefined;
      }
    })(),
  };
}

function buildUrl(query: NanoMeting.SearchParams) {
  const url = new URL(NANO_METING);
  Object.entries(query).reduce((acc, [k, v]) => {
    acc.append(k, v);
    return acc;
  }, url.searchParams);
  return url;
}

function fetchJson<T>(url: RequestInfo | URL): Promise<T | undefined> {
  return fetch(url, {
    headers: buildHeader(),
  })
    .then((i) => i.json() as Promise<T>)
    .catch((i) => undefined);
}

async function fetchRedirect(
  url: RequestInfo | URL,
): Promise<RequestInfo | URL> {
  const res = await fetch(url, {
    headers: buildHeader(),
    redirect: "manual",
  });
  const location = res.headers.get("Location");
  return location === null ? url : location;
}

async function searchByProvider(query: string, server: NanoMeting.Provider) {
  const search = (await fetchJson(
    buildUrl({
      server,
      type: "search",
      id: "0",
      keyword: query,
    }),
  )) as NanoMeting.SearchRsp | undefined;
  if (search === undefined) {
    return { isEnd: true, data: [] } as IPlugin.ISearchResult<"music">;
  }
  const data = [] as IMusic.IMusicItem[];
  // 这里写成这个逆天样子不是故意的，访问太快容易把 NanoRocky 的腾讯防火墙干出来，还得等 10 秒左右差不多才正常，搜索比较后面的也不正常
  // man what can i say
  for (const i of search) {
    data.push({
      artist: i.artist,
      title: i.name,
      album: i.album,
      artwork:
        server !== "tencent" ? i.pic : (await fetchRedirect(i.pic)).toString(),
      url: i.url,
      lrc: i.lrc,
      platform: server,
      id: new URL(i.url).searchParams.get("id"),
    });
  }
  return { isEnd: true, data } as IPlugin.ISearchResult<"music">;
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

async function getMusicInfo(
  musicBase: IMedia.IMediaBase,
): Promise<Partial<IMusic.IMusicItem> | null> {
  if (musicBase.platform !== "netease" && musicBase.platform !== "tencent") {
    return null;
  }
  try {
    const req = await fetch(
      buildUrl({
        server: musicBase.platform,
        type: "song",
        id: String(musicBase.id),
      }),
      {
        headers: buildHeader(),
      },
    );
    const rsp = (await req.json()) as NanoMeting.SongItem[];
    if (rsp.length < 1) {
      return null;
    }
    return {
      artist: rsp[0].artist,
      title: rsp[0].name,
      url: rsp[0].url,
      lrc: rsp[0].lrc,
      artwork:
        musicBase.platform !== "tencent"
          ? rsp[0].pic
          : (await fetchRedirect(rsp[0].pic)).toString(),
      platform: musicBase.platform,
    };
  } catch (e) {
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
  getMusicInfo,
} as IPlugin.IPluginDefine;
