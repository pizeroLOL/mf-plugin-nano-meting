declare namespace NanoMeting {
  type Provider = "netease" | "tencent";
  // TODO: more bound
  interface SearchParams {
    server: Provider;
    type:
      | "name"
      | "artist"
      | "url"
      | "pic"
      | "lrc"
      | "song"
      | "playlist"
      | "search";
    id: string;
    picsize?: number;
    keyword?: string;
    dwrc?: boolean | "open";
    trlrc?: boolean | "only";
  }
  interface SongItem {
    name: string;
    artist: string;
    url: string;
    pic: string;
    lrc: string;
  }
  interface SearchPspItem {
    name: string;
    artist: string;
    album: string;
    url: string;
    pic: string;
    lrc: string;
    source: Provider;
  }
  type SearchRsp = SearchPspItem[];
}
