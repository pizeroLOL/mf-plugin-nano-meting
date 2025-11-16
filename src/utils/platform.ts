export const PLATFORM_NAMES: Record<NanoMeting.Provider, string> = {
    netease: "Netease",
    tencent: "Tencent",
};

export const PLATFORM_PREFIX: Record<string, NanoMeting.Provider> = {
    N: "netease",
    T: "tencent",
};

export const PROVIDER_FIELD = "$nmProvider" as const;

export function parsePlaylistId(input: string): { provider: NanoMeting.Provider; id: string } | null {
    const match = input.trim().match(/^([A-Z]+)\*(.+)$/i);
    if (!match) return null;

    const [, prefix, id] = match;
    const provider = PLATFORM_PREFIX[prefix.toUpperCase()];
    if (!provider || !id) return null;
    return { provider, id };
}

function normalizeProvider(value?: string | null): NanoMeting.Provider | null {
    if (!value) return null;
    const lower = value.toLowerCase();
    return lower === "netease" || lower === "tencent" ? (lower as NanoMeting.Provider) : null;
}

export function resolveProvider(musicItem: IMusic.IMusicItemPartial): NanoMeting.Provider | null {
    const viaPlatform = normalizeProvider(musicItem.platform as string | undefined);
    if (viaPlatform) return viaPlatform;

    const record = musicItem as Record<string, unknown>;
    const viaField = normalizeProvider(record[PROVIDER_FIELD] as string | undefined);
    if (viaField) return viaField;

    return normalizeProvider(record.provider as string | undefined);
}
