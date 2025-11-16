import { looksLikeUrl } from "./common";
import { resolveProvider } from "./platform";
import { fetchTextResource, getLyric as getMetingLyric } from "./meting";

async function extractLyricFromItem(musicItem: IMusic.IMusicItemPartial): Promise<string | null> {
    const lyric = (musicItem as IMusic.IMusicItemPartial & { lrc?: string }).lrc;
    if (!lyric) return null;
    if (looksLikeUrl(lyric)) {
        return await fetchTextResource(lyric);
    }
    return lyric;
}

export async function getLyricSource(
    musicItem: IMusic.IMusicItemPartial,
): Promise<ILyric.ILyricSource | null> {
    try {
        const inlineLyric = await extractLyricFromItem(musicItem);
        if (inlineLyric) {
            return { rawLrc: inlineLyric };
        }

        const provider = resolveProvider(musicItem);
        const { id } = musicItem;
        if (!provider || !id) {
            console.warn("getLyricSource: 缺少必要的歌曲信息");
            return null;
        }

        const fallbackLyric = await getMetingLyric(String(id), provider, false, true);
        return fallbackLyric ? { rawLrc: fallbackLyric } : null;
    } catch (error) {
        console.error("获取歌词失败:", error);
        return null;
    }
}
