declare namespace NanoMeting {
  type Provider = "netease" | "tencent";

  type RequestType =
    | "name"
    | "artist"
    | "url"
    | "pic"
    | "lrc"
    | "song"
    | "playlist"
    | "search";

  interface SearchParams {
    server: Provider;
    type: RequestType;
    id: string;
    picsize?: number;
    keyword?: string;
    br?: number;
    dwrc?: boolean | "open";
    trlrc?: boolean | "only";
  }

  interface SearchPspItem {
    name: string;
    artist: string;
    album: string;
    url: string;
    pic: string;
    lrc: string;
    sourse: Provider;
  }

  type SearchRsp = SearchPspItem[];

  // 单个属性响应
  interface NameResponse {
    name: string;
  }

  interface ArtistResponse {
    artist: string;
  }

  interface UrlResponse {
    url: string;
  }

  interface PicResponse {
    pic: string;
  }

  interface LrcResponse {
    lrc: string;
  }
}
