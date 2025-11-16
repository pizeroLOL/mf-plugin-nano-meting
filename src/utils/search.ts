import { searchMusic, getPlaylist } from "./meting";
import { PLATFORM_NAMES, parsePlaylistId, PROVIDER_FIELD } from "./platform";

const SEARCH_PROVIDERS: NanoMeting.Provider[] = ["tencent", "netease"];
const PROVIDER_DELAY = 700;
const CHUNK_SIZE = 5;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function interleaveArrays<T>(arrays: T[][], chunkSize = CHUNK_SIZE): T[] {
    const result: T[] = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
        hasMore = false;
        for (const arr of arrays) {
            const chunk = arr.slice(offset, offset + chunkSize);
            if (chunk.length > 0) {
                result.push(...chunk);
                hasMore = true;
            }
        }
        offset += chunkSize;
    }

    return result;
}

async function searchByProvider(query: string, server: NanoMeting.Provider) {
    try {
        const results = await searchMusic(query, server);
        const platformPrefix = `[${PLATFORM_NAMES[server]}] `;

        return {
            isEnd: true,
            data: results.map((item) => {
                let songId: string | null = null;
                try {
                    songId = new URL(item.url).searchParams.get("id");
                } catch {
                    const match = item.url.match(/[?&]id=([^&]+)/);
                    songId = match ? match[1] : null;
                }

                return {
                    artist: item.artist,
                    title: platformPrefix + item.name,
                    album: item.album,
                    artwork: item.pic,
                    url: item.url,
                    lrc: item.lrc,
                    platform: server,
                    id: songId || item.name,
                    [PROVIDER_FIELD]: server,
                };
            }),
        } as IPlugin.ISearchResult<"music">;
    } catch (error) {
        console.error("searchByProvider failed:", error);
        return { isEnd: true, data: [] } as IPlugin.ISearchResult<"music">;
    }
}

async function searchMultipleProviders(query: string, providers: NanoMeting.Provider[]) {
    const results: IPlugin.ISearchResult<"music">[] = [];

    for (let i = 0; i < providers.length; i++) {
        if (i > 0) {
            await delay(PROVIDER_DELAY);
        }
        const result = await searchByProvider(query, providers[i]);
        results.push(result);
    }

    return results;
}

async function searchSheet(query: string): Promise<IPlugin.ISearchResult<"sheet">> {
    const parsed = parsePlaylistId(query);
    if (!parsed) {
        console.warn("无法解析歌单ID，请使用格式：N*歌单ID 或 T*歌单ID");
        return { isEnd: true, data: [] } as IPlugin.ISearchResult<"sheet">;
    }

    try {
        const songs = await getPlaylist(parsed.id, parsed.provider);
        const platformPrefix = `[${PLATFORM_NAMES[parsed.provider]}] `;

        const musicList = songs.map((song) => {
            let songId: string | null = null;
            try {
                songId = new URL(song.url).searchParams.get("id");
            } catch {
                const match = song.url.match(/[?&]id=([^&]+)/);
                songId = match ? match[1] : null;
            }

            return {
                artist: song.artist,
                title: platformPrefix + song.name,
                album: song.album,
                artwork: song.pic,
                url: song.url,
                lrc: song.lrc,
                platform: parsed.provider,
                id: songId || song.name,
                [PROVIDER_FIELD]: parsed.provider,
            };
        });

        return {
            isEnd: true,
            data: [
                {
                    id: parsed.id,
                    platform: parsed.provider,
                    title: `${PLATFORM_NAMES[parsed.provider]} 歌单 ${parsed.id}`,
                    musicList,
                    worksNum: musicList.length,
                },
            ],
        } as IPlugin.ISearchResult<"sheet">;
    } catch (error) {
        console.error("获取歌单失败:", error);
        return { isEnd: true, data: [] } as IPlugin.ISearchResult<"sheet">;
    }
}

async function searchMusicType(query: string) {
    try {
        const results = await searchMultipleProviders(query, SEARCH_PROVIDERS);
        const dataArrays = results.map((r) => r.data);
        const mergedData = interleaveArrays(dataArrays);

        return {
            isEnd: true,
            data: mergedData,
        } as IPlugin.ISearchResult<"music">;
    } catch (error) {
        console.error("Search failed:", error);
        return { isEnd: true, data: [] } as IPlugin.ISearchResult<"music">;
    }
}

export async function performSearch<T extends IMedia.SupportMediaType>(
    query: string,
    _page: number,
    type: T,
): Promise<IPlugin.ISearchResult<T>> {
    if (type === "sheet") {
        return (await searchSheet(query)) as IPlugin.ISearchResult<T>;
    }

    if (type !== "music") {
        return { isEnd: true, data: [] } as IPlugin.ISearchResult<T>;
    }

    return (await searchMusicType(query)) as IPlugin.ISearchResult<T>;
}
