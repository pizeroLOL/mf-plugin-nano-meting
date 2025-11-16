export const NANO_METING_ENDPOINT = "https://metingapi.nanorocky.top/";
export const NANO_METING_HOST = new URL(NANO_METING_ENDPOINT).host;

export const DEFAULT_HEADERS = {
    Referer: "https://musicfree.catcat.work/",
    Origin: "https://musicfree.catcat.work",
};

const buildUrl = (query: NanoMeting.SearchParams) => {
    const url = new URL(NANO_METING_ENDPOINT);
    Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
            url.searchParams.append(k, String(v));
        }
    });
    return url;
};

/**
 * 通用请求函数
 */
async function request<T>(params: NanoMeting.SearchParams): Promise<T | null> {
    try {
        const response = await fetch(buildUrl(params), {
            headers: DEFAULT_HEADERS,
        });
        return await response.json();
    } catch (error) {
        console.error(`MetingAPI request failed:`, error);
        return null;
    }
}

export async function fetchTextResource(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, { headers: DEFAULT_HEADERS });
        if (!response.ok) {
            console.warn("fetchTextResource: unexpected status", response.status);
            return null;
        }
        const text = await response.text();
        return text || null;
    } catch (error) {
        console.error("fetchTextResource failed:", error);
        return null;
    }
}

/**
 * 搜索音乐
 * @param keyword 搜索关键词
 * @param server 音乐平台
 * @returns 搜索结果
 */
export async function searchMusic(
    keyword: string,
    server: NanoMeting.Provider,
): Promise<NanoMeting.SearchRsp> {
    const data = await request<NanoMeting.SearchRsp>({
        server,
        type: "search",
        id: "0",
        keyword,
    });
    return data || [];
}

/**
 * 获取单曲详情
 * @param id 音乐ID
 * @param server 音乐平台
 * @param br 歌曲最高音质（可选，如 1411 即 1411kbps）
 * @returns 单曲详情
 */
export async function getSong(
    id: string,
    server: NanoMeting.Provider,
    br?: number,
): Promise<NanoMeting.SearchPspItem | null> {
    const params: NanoMeting.SearchParams = {
        server,
        type: "song",
        id,
    };
    if (br) {
        params.br = br;
    }
    const data = await request<NanoMeting.SearchRsp>(params);
    return data && data.length > 0 ? data[0] : null;
}

/**
 * 获取歌单详情
 * @param id 歌单ID
 * @param server 音乐平台
 * @returns 歌单详情
 */
export async function getPlaylist(
    id: string,
    server: NanoMeting.Provider,
): Promise<NanoMeting.SearchRsp> {
    const data = await request<NanoMeting.SearchRsp>({
        server,
        type: "playlist",
        id,
    });
    return data || [];
}

/**
 * 获取歌曲名称
 * @param id 音乐ID
 * @param server 音乐平台
 * @returns 歌曲名称
 */
export async function getMusicName(
    id: string,
    server: NanoMeting.Provider,
): Promise<string | null> {
    const data = await request<NanoMeting.NameResponse>({
        server,
        type: "name",
        id,
    });
    return data?.name || null;
}

/**
 * 获取歌手名称
 * @param id 音乐ID
 * @param server 音乐平台
 * @returns 歌手名称
 */
export async function getMusicArtist(
    id: string,
    server: NanoMeting.Provider,
): Promise<string | null> {
    const data = await request<NanoMeting.ArtistResponse>({
        server,
        type: "artist",
        id,
    });
    return data?.artist || null;
}

/**
 * 获取音乐播放链接
 * @param id 音乐ID
 * @param server 音乐平台
 * @param br 歌曲最高音质（可选，如 1411 即 1411kbps）
 * @returns 播放链接
 */
export async function getMusicUrl(
    id: string,
    server: NanoMeting.Provider,
    br?: number,
): Promise<string | null> {
    const params: NanoMeting.SearchParams = {
        server,
        type: "url",
        id,
    };
    if (br) {
        params.br = br;
    }
    const data = await request<NanoMeting.UrlResponse>(params);
    return data?.url || null;
}

/**
 * 获取歌曲封面
 * @param id 音乐ID
 * @param server 音乐平台
 * @param picsize 封面大小（可选）
 * @returns 封面链接
 */
export async function getMusicPic(
    id: string,
    server: NanoMeting.Provider,
    picsize?: number,
): Promise<string | null> {
    const params: NanoMeting.SearchParams = {
        server,
        type: "pic",
        id,
    };
    if (picsize) {
        params.picsize = picsize;
    }
    const data = await request<NanoMeting.PicResponse>(params);
    return data?.pic || null;
}

/**
 * 获取歌词
 * @param id 音乐ID
 * @param server 音乐平台
 * @param dwrc 逐字歌词解析开关（可选：false-禁用, true-启用, "open"-备用启用模式）
 * @param trlrc 翻译歌词显示开关（可选：false-禁用, true-启用, "only"-仅翻译）
 * @returns 歌词
 */
export async function getLyric(
    id: string,
    server: NanoMeting.Provider,
    dwrc?: boolean | "open",
    trlrc?: boolean | "only",
): Promise<string | null> {
    const params: NanoMeting.SearchParams = {
        server,
        type: "lrc",
        id,
    };
    if (dwrc !== undefined) {
        params.dwrc = dwrc;
    }
    if (trlrc !== undefined) {
        params.trlrc = trlrc;
    }
    const data = await request<NanoMeting.LrcResponse>(params);
    return data?.lrc || null;
}
