import { resolveProvider } from "./platform";
import { getMusicPic } from "./meting";

function extractArtworkFromItem(musicItem: IMusic.IMusicItemPartial): string | null {
    const artwork = musicItem.artwork || (musicItem as { pic?: string }).pic;
    return artwork || null;
}

export async function getMusicInfoDetails(
    musicBase: IMedia.IMediaBase,
): Promise<Partial<IMusic.IMusicItem> | null> {
    try {
        const inlineArtwork = extractArtworkFromItem(musicBase as IMusic.IMusicItemPartial);
        if (inlineArtwork) {
            return { artwork: inlineArtwork };
        }

        const provider = resolveProvider(musicBase as IMusic.IMusicItemPartial);
        const { id } = musicBase;
        if (!provider || !id) return null;

        const artwork = await getMusicPic(String(id), provider);
        return artwork ? { artwork } : {};
    } catch (error) {
        console.error("获取音乐详情失败:", error);
        return null;
    }
}
