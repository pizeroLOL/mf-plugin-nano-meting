import { looksLikeUrl, extractIdFromUrl } from "./common";
import { resolveProvider } from "./platform";
import { DEFAULT_HEADERS, NANO_METING_HOST, getMusicUrl } from "./meting";

async function resolvePlayableUrl(musicItem: IMusic.IMusicItemPartial): Promise<string | null> {
    const directUrl = musicItem.url;
    const isDirectPlayable = directUrl && looksLikeUrl(directUrl) && !directUrl.includes(NANO_METING_HOST);
    if (isDirectPlayable) {
        return directUrl as string;
    }

    const provider = resolveProvider(musicItem);
    const musicId = musicItem.id || extractIdFromUrl(directUrl);

    if (!provider || !musicId) {
        return directUrl || null;
    }

    const resolvedUrl = await getMusicUrl(String(musicId), provider);
    return resolvedUrl || directUrl || null;
}

export async function getMediaSourceResult(
    musicItem: IMusic.IMusicItemPartial,
    _quality: IMusic.IQualityKey,
): Promise<IPlugin.IMediaSourceResult | null> {
    const resolvedUrl = await resolvePlayableUrl(musicItem);
    if (!resolvedUrl) {
        console.warn("getMediaSource: 未能获取有效的播放链接");
        return null;
    }

    return {
        url: resolvedUrl,
        headers: DEFAULT_HEADERS,
    };
}
