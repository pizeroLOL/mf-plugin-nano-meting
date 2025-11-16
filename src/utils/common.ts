export const looksLikeUrl = (value?: string | null): boolean =>
    !!value && /^https?:\/\//i.test(value.trim());

export function extractIdFromUrl(source?: string | null): string | null {
    if (!source) return null;
    try {
        return new URL(source).searchParams.get("id");
    } catch {
        const match = source.match(/[?&]id=([^&]+)/);
        return match ? match[1] : null;
    }
}
