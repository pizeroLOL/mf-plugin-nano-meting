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
    const search = (await iData.json()) as NanoMeting.SearchRsp;
    const data = [] as IMusic.IMusicItem[];
    // 这里写成这个逆天样子不是故意的，访问太快容易把 NanoRocky 的腾讯防火墙干出来，还得等 10 秒左右差不多才正常，搜索比较后面的也不正常
    // man what can i say
    for (const i of search) {
      data.push({
        artist: i.artist,
        title: i.name,
        album: i.album,
        artwork:
          server !== "tencent"
            ? i.pic
            : await fetch(i.pic, {
                headers: buildHeader(),
                redirect: "manual",
              })
                .then((i) => i.headers.get("Location"))
                .then((url) => (i === null ? i.pic : url)),
        url: i.url,
        lrc: i.lrc,
        platform: server,
        id: new URL(i.url).searchParams.get("id"),
      });
    }
    return { isEnd: true, data } as IPlugin.ISearchResult<"music">;
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
    const picRsp = await fetch(rsp[0].pic, {
      headers: buildHeader(),
      redirect: "manual",
    });
    const picLocation = picRsp.headers.get("Location");
    return picLocation === null
      ? null
      : {
          artist: rsp[0].artist,
          title: rsp[0].name,
          url: rsp[0].url,
          lrc: rsp[0].lrc,
          artwork: picLocation,
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
