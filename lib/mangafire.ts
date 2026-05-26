const MANGAFIRE_BASE_URL = "https://mangafire.to";
const MANGAFIRE_HEADERS = {
  Accept: "text/html",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
};
const MANGAFIRE_SEARCH_TYPES = [
  { path: "manga", label: "Manga" },
  { path: "manhwa", label: "Manhwa" },
] as const;

export interface MangaFireItem {
  id: string;
  title: string;
  url: string;
  posterUrl: string | null;
  type: string;
}

export interface MangaFireHome {
  featured: MangaFireItem[];
  mostViewed: MangaFireItem[];
  recentlyUpdated: MangaFireItem[];
  newRelease: MangaFireItem[];
}

export interface MangaFireChapter {
  id: string;
  title: string;
  url: string;
  number: string;
  releaseDate: string | null;
}

export interface MangaFireDetails {
  id: string;
  title: string;
  posterUrl: string | null;
  chapters: MangaFireChapter[];
}

export const MANGAFIRE_FALLBACK_ITEMS: MangaFireItem[] = [
  {
    id: "one-piecee.dkw",
    title: "One Piece",
    url: `${MANGAFIRE_BASE_URL}/manga/one-piecee.dkw`,
    posterUrl:
      "https://static.mfcdn.nl/a96c/i/8/22/bcfcc8f19ec17a2929fa55d8945ea18b.jpg",
    type: "Manga",
  },
  {
    id: "dragon-ball-superr.4qo",
    title: "Dragon Ball Super",
    url: `${MANGAFIRE_BASE_URL}/manga/dragon-ball-superr.4qo`,
    posterUrl:
      "https://static.mfcdn.nl/4b18/i/a/0f/aa703aedf24f7bcc85907c4a1655d24e.jpg",
    type: "Manga",
  },
  {
    id: "narutoo.l33",
    title: "Naruto",
    url: `${MANGAFIRE_BASE_URL}/manga/narutoo.l33`,
    posterUrl:
      "https://static.mfcdn.nl/6a68/i/5/51/51360d75d5ffa0cc3234dc79d9c36d26.jpg",
    type: "Manga",
  },
  {
    id: "berserkk.m2vv",
    title: "Berserk",
    url: `${MANGAFIRE_BASE_URL}/manga/berserkk.m2vv`,
    posterUrl:
      "https://static.mfcdn.nl/eb19/i/0/0e/0e2422ee85a74121b551d2b65d493afe.jpg",
    type: "Manga",
  },
  {
    id: "kingdomm.w1qk",
    title: "Kingdom",
    url: `${MANGAFIRE_BASE_URL}/manga/kingdomm.w1qk`,
    posterUrl:
      "https://static.mfcdn.nl/3aa9/i/9/95/da60f7045a1a04bbde01520eb24c793e.jpg",
    type: "Manga",
  },
  {
    id: "one-punch-mann.oo4",
    title: "One-Punch Man (Official)",
    url: `${MANGAFIRE_BASE_URL}/manga/one-punch-mann.oo4`,
    posterUrl:
      "https://static.mfcdn.nl/54ed/i/3/37/e6da183e3030b35909f7940e193589a8.jpg",
    type: "Manga",
  },
];

export const MANGAFIRE_FALLBACK_HOME: MangaFireHome = {
  featured: MANGAFIRE_FALLBACK_ITEMS,
  mostViewed: MANGAFIRE_FALLBACK_ITEMS,
  recentlyUpdated: MANGAFIRE_FALLBACK_ITEMS,
  newRelease: MANGAFIRE_FALLBACK_ITEMS,
};

function decodeHtml(value: string): string {
  return value
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${MANGAFIRE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function slugFromUrl(url: string): string {
  return (
    url
      .split("/")
      .pop()
      ?.replace(/[^a-zA-Z0-9.-]/g, "") || url
  );
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ""));
}

function mangaPathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return url.replace(MANGAFIRE_BASE_URL, "").replace(/^\/+/, "");
  }
}

function pushMangaItem(
  items: MangaFireItem[],
  seen: Set<string>,
  href: string,
  imageSrc: string | null,
  title: string,
  type = "Manga",
) {
  const id = slugFromUrl(href);
  const nextTitle = decodeHtml(title);

  if (seen.has(id) || !nextTitle) return;
  seen.add(id);

  items.push({
    id,
    title: nextTitle,
    url: absoluteUrl(href),
    posterUrl: imageSrc ? absoluteUrl(imageSrc) : null,
    type,
  });
}

function parsePosterAnchors(html: string, type = "Manga"): MangaFireItem[] {
  const seen = new Set<string>();
  const items: MangaFireItem[] = [];
  const cardPattern =
    /<a\b(?=[^>]*\bhref=(["'])([^"']*\/manga\/[^"']+)\1)(?=[^>]*\bclass=(["'])[^"']*\bposter\b[^"']*\3)[^>]*>([\s\S]*?)<\/a>/gi;
  const imgPattern =
    /<img\b[^>]*(?:\bsrc|\bdata-src)=(["'])([^"']+)\1[^>]*\balt=(["'])([^"']*)\3/i;

  for (const match of html.matchAll(cardPattern)) {
    const img = match[4].match(imgPattern);

    if (!img) continue;

    pushMangaItem(items, seen, match[2], img[2], img[4], type);
  }

  return items;
}

function parseMangaCards(html: string, type = "Manga"): MangaFireItem[] {
  const seen = new Set<string>();
  const items: MangaFireItem[] = [];
  const cardPattern =
    /<a\b(?=[^>]*\bhref=(["'])([^"']*\/manga\/[^"']+)\1)[^>]*>([\s\S]*?)<\/a>/gi;
  const imgPattern =
    /<img\b[^>]*(?:\bsrc|\bdata-src)=(["'])([^"']+)\1[^>]*\balt=(["'])([^"']*)\3/i;

  for (const match of html.matchAll(cardPattern)) {
    const img = match[3].match(imgPattern);

    if (!img) continue;

    pushMangaItem(items, seen, match[2], img[2], img[4], type);
  }

  return items;
}

function parseMangaSearchCards(html: string, type = "Manga"): MangaFireItem[] {
  const seen = new Set<string>();
  const items: MangaFireItem[] = [];
  const blockPattern =
    /<div\b(?=[^>]*\bclass=(["'])[^"']*(?:manga|unit|item|card)[^"']*\1)[^>]*>([\s\S]*?)(?=<div\b(?=[^>]*\bclass=(["'])[^"']*(?:manga|unit|item|card)[^"']*\3)|<\/section>|<\/main>|$)/gi;
  const hrefPattern = /<a\b[^>]*\bhref=(["'])([^"']*\/manga\/[^"']+)\1[^>]*>/i;
  const imgPattern =
    /<img\b[^>]*(?:\bsrc|\bdata-src)=(["'])([^"']+)\1[^>]*(?:\balt=(["'])([^"']*)\3)?/i;
  const titlePattern =
    /<a\b(?=[^>]*\bhref=(["'])([^"']*\/manga\/[^"']+)\1)(?=[^>]*\bclass=(["'])[^"']*(?:title|name)[^"']*\3)[^>]*>([\s\S]*?)<\/a>/i;

  for (const match of html.matchAll(blockPattern)) {
    const block = match[2];
    const href = block.match(hrefPattern)?.[2];

    if (!href) continue;

    const image = block.match(imgPattern);
    const title = stripTags(block.match(titlePattern)?.[4] || image?.[4] || "");

    pushMangaItem(items, seen, href, image?.[2] ?? null, title, type);
  }

  return items;
}

function parseMangaTitleLinks(html: string, type = "Manga"): MangaFireItem[] {
  const seen = new Set<string>();
  const items: MangaFireItem[] = [];
  const anchorPattern =
    /<a\b(?=[^>]*\bhref=(["'])([^"']*\/manga\/[^"']+)\1)[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const title = stripTags(match[3]);

    if (
      !title ||
      /^chap(?:ter)?\b/i.test(title) ||
      /^vol(?:ume)?\b/i.test(title)
    )
      continue;

    pushMangaItem(items, seen, match[2], null, title, type);
  }

  return items;
}

function filterFallbackManga(query: string): MangaFireItem[] {
  const needle = query.trim().toLowerCase();

  if (!needle) return [];

  return MANGAFIRE_FALLBACK_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(needle),
  );
}

function uniqueMangaItems(items: MangaFireItem[]): MangaFireItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sliceBetween(
  html: string,
  startNeedle: string,
  endNeedle: string,
): string {
  const start = html.indexOf(startNeedle);

  if (start === -1) return "";

  const end = html.indexOf(endNeedle, start + startNeedle.length);

  return end === -1 ? html.slice(start) : html.slice(start, end);
}

function parseMangaFireHome(html: string): MangaFireHome {
  const featured = parsePosterAnchors(html).slice(0, 24);
  const mostViewedDay = sliceBetween(
    html,
    '<div class="tab-content" data-name="day" style="display:block">',
    '<div class="tab-content" data-name="week"',
  );
  const recentlyUpdatedSection = sliceBetween(
    html,
    "<h2>Recently Updated</h2>",
    '<div class="tab-content ajax-content">',
  );
  const newReleaseSection = sliceBetween(
    html,
    "<h2>New Release</h2>",
    "</section>",
  );

  return {
    featured: featured.length > 0 ? featured : MANGAFIRE_FALLBACK_HOME.featured,
    mostViewed: parseMangaCards(mostViewedDay).slice(0, 20),
    recentlyUpdated: parsePosterAnchors(recentlyUpdatedSection).slice(0, 20),
    newRelease: parseMangaCards(newReleaseSection).slice(0, 20),
  };
}

function withFallbacks(home: MangaFireHome): MangaFireHome {
  return {
    featured:
      home.featured.length > 0
        ? home.featured
        : MANGAFIRE_FALLBACK_HOME.featured,
    mostViewed:
      home.mostViewed.length > 0
        ? home.mostViewed
        : MANGAFIRE_FALLBACK_HOME.mostViewed,
    recentlyUpdated:
      home.recentlyUpdated.length > 0
        ? home.recentlyUpdated
        : MANGAFIRE_FALLBACK_HOME.recentlyUpdated,
    newRelease:
      home.newRelease.length > 0
        ? home.newRelease
        : MANGAFIRE_FALLBACK_HOME.newRelease,
  };
}

export async function getMangaFireHome(): Promise<MangaFireHome> {
  const res = await fetch(`${MANGAFIRE_BASE_URL}/home`, {
    headers: MANGAFIRE_HEADERS,
  });

  if (!res.ok) {
    throw new Error(`MangaFire ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  return withFallbacks(parseMangaFireHome(html));
}

async function searchMangaFireType(
  query: string,
  typePath: string,
  typeLabel: string,
): Promise<MangaFireItem[]> {
  const params = new URLSearchParams({
    keyword: query,
    page: "1",
  });
  const res = await fetch(
    `${MANGAFIRE_BASE_URL}/type/${typePath}?${params.toString()}`,
    {
      headers: MANGAFIRE_HEADERS,
    },
  );

  if (!res.ok) {
    throw new Error(`MangaFire ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  const searchCardResults = parseMangaSearchCards(html, typeLabel);

  if (searchCardResults.length > 0) return searchCardResults;

  const results = parseMangaCards(html, typeLabel);

  if (results.length > 0) return results;

  const posterResults = parsePosterAnchors(html, typeLabel);

  if (posterResults.length > 0) return posterResults;

  return parseMangaTitleLinks(html, typeLabel);
}

export async function searchMangaFire(query: string): Promise<MangaFireItem[]> {
  const trimmed = query.trim();

  if (!trimmed) return [];

  const settledResults = await Promise.allSettled(
    MANGAFIRE_SEARCH_TYPES.map((type) =>
      searchMangaFireType(trimmed, type.path, type.label),
    ),
  );
  const results = settledResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (results.length > 0) return uniqueMangaItems(results);

  const fallbackResults = filterFallbackManga(trimmed);

  if (fallbackResults.length > 0) return fallbackResults;

  const rejected = settledResults.find(
    (result) => result.status === "rejected",
  );

  if (rejected?.status === "rejected") {
    throw rejected.reason instanceof Error
      ? rejected.reason
      : new Error("MangaFire search failed");
  }

  return [];
}

export async function getMangaFireDetails(
  mangaUrl: string,
): Promise<MangaFireDetails> {
  const path = mangaPathFromUrl(mangaUrl);
  const res = await fetch(absoluteUrl(path), {
    headers: MANGAFIRE_HEADERS,
  });

  if (!res.ok) {
    throw new Error(`MangaFire ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  const title = decodeHtml(
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, "") ||
      slugFromUrl(path),
  );
  // MangaFire sometimes uses `src` or `data-src` for the poster image.
  const posterMatch = html.match(
    /<img\b[^>]*\b(?:src|data-src)=(["'])([^"']+)\1[^>]*\balt=(["'])([^"']*)\3/i,
  );
  const chapterPattern =
    /<li\b[^>]*\bclass=(["'])[^"']*\bitem\b[^"']*\1[^>]*\bdata-number=(["'])([^"']+)\2[^>]*>\s*<a\b[^>]*\bhref=(["'])([^"']+)\4[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>/gi;
  const chapters: MangaFireChapter[] = [];

  for (const match of html.matchAll(chapterPattern)) {
    const url = absoluteUrl(match[5]);

    chapters.push({
      id: slugFromUrl(match[5]),
      title: decodeHtml(match[6].replace(/<[^>]+>/g, "")),
      url,
      number: decodeHtml(match[3]),
      releaseDate: decodeHtml(match[7].replace(/<[^>]+>/g, "")) || null,
    });
  }

  return {
    id: slugFromUrl(path),
    title,
    posterUrl: posterMatch ? absoluteUrl(posterMatch[2]) : null,
    chapters,
  };
}
