import { performSearch } from "./utils/search";
import { getLyricSource } from "./utils/lyric";
import { getMusicInfoDetails } from "./utils/musicInfo";
import { getMediaSourceResult } from "./utils/mediaSource";

async function search<T extends IMedia.SupportMediaType>(
  query: string,
  page: number,
  type: T,
) {
  return performSearch(query, page, type);
}

async function getLyric(musicItem: IMusic.IMusicItemPartial) {
  return getLyricSource(musicItem);
}

async function getMusicInfo(musicBase: IMedia.IMediaBase) {
  return getMusicInfoDetails(musicBase);
}

async function getMediaSource(
  musicItem: IMusic.IMusicItemPartial,
  quality: IMusic.IQualityKey,
) {
  return getMediaSourceResult(musicItem, quality);
}

export default {
  platform: "nano-meting",
  author: "Pizero",
  primaryKey: ["id", "platform"],
  cacheControl: "cache",
  version: "0.0.1",
  supportedSearchType: ["music", "sheet"],
  hints: {
    importMusicSheet: [
      "请输入歌单ID,格式:来源*ID",
      "例如:N*3035221869(网易云)或 T*9518088898(QQ音乐)",
    ],
    importMusicItem: [],
  },
  search,
  getLyric,
  getMusicInfo,
  getMediaSource,
} as IPlugin.IPluginDefine;
