import { parseStringPromise } from 'xml2js';

/**
 * Parse XML string to JSON.
 * @param {string} xml
 * @returns {Promise<object>}
 */
export async function xmlToJson(xml) {
  return parseStringPromise(xml, {
    explicitArray: true,
    trim: true,
    ignoreAttrs: false,
    strict: false, // allow malformed XML (e.g. attributes without values in some RSS feeds)
  });
}

/**
 * Normalize a single value from RSS (could be string, [string], or xml2js object with ._).
 */
function first(v) {
  if (v == null) return '';
  if (Array.isArray(v) && v.length) v = v[0];
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._ != null) return String(v._);
  return '';
}

/** Get value from item with either lowercase or uppercase key (xml2js may uppercase). */
function get(item, ...keys) {
  for (const k of keys) {
    const v = item?.[k] ?? item?.[k.toUpperCase()];
    if (v !== undefined && v !== null) return first(v);
  }
  return '';
}

function normalizeToArray(val) {
  if (Array.isArray(val)) return val;
  if (val != null) return [val];
  return [];
}

/** Get channel object from root (handles both lowercase and uppercase keys from xml2js). */
function getChannel(rootObj) {
  const ch = rootObj?.channel ?? rootObj?.CHANNEL;
  return Array.isArray(ch) ? ch[0] : ch;
}

/** Get items array from channel (item or ITEM). */
function getItems(channelObj) {
  if (!channelObj) return [];
  const items = channelObj.item ?? channelObj.ITEM ?? channelObj.entry ?? channelObj.ENTRY;
  return normalizeToArray(items);
}

/**
 * Extract job items from parsed RSS/XML. xml2js often returns UPPERCASE keys (RSS, CHANNEL, ITEM).
 */
export function extractItemsFromParsedXml(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];

  // RSS 2.0: <rss><channel><item> — try both cases (xml2js may uppercase keys)
  const rootKeys = ['rss', 'RSS', ...Object.keys(parsed)];
  const seen = new Set();
  for (const rootKey of rootKeys) {
    if (seen.has(rootKey)) continue;
    seen.add(rootKey);
    const root = parsed[rootKey];
    if (!root || typeof root !== 'object') continue;
    const rootObj = Array.isArray(root) ? root[0] : root;
    const channelObj = getChannel(rootObj);
    const items = getItems(channelObj);
    if (items.length) return items;
  }

  // Atom: <feed><entry>
  const feed = parsed.feed ?? parsed.FEED;
  if (feed) {
    const feedObj = Array.isArray(feed) ? feed[0] : feed;
    const entries = feedObj?.entry ?? feedObj?.ENTRY;
    if (entries != null) return normalizeToArray(entries);
  }

  return [];
}

/**
 * Resolve link from item (can be string, array, or Atom-style object with href). Handles uppercase keys.
 */
function resolveLink(item) {
  const raw = item?.link ?? item?.LINK;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length) {
    const v = raw[0];
    if (typeof v === 'string') return v;
    if (v?.$?.href) return v.$.href;
    if (v?._) return String(v._);
  }
  if (raw && typeof raw === 'object' && raw.$?.href) return raw.$.href;
  if (raw && typeof raw === 'object' && raw._) return String(raw._);
  return '';
}

/**
 * Map a raw RSS item to our canonical job shape. Handles both lowercase and uppercase keys (xml2js).
 */
export function mapRssItemToJob(item, sourceUrl) {
  const link = resolveLink(item);
  const guid = get(item, 'guid');
  const title = get(item, 'title');
  const desc = get(item, 'description', 'content:encoded', 'content');
  const pubDate = get(item, 'pubDate', 'published');
  const company = get(item, 'job_listing:company', 'job:company', 'company', 'creator');
  const location = get(item, 'job_listing:location', 'job:location', 'location');

  const externalId =
    guid || (link ? `url:${link}` : `title:${title}`) || `hash:${hashString(sourceUrl + title)}`;

  return {
    externalId: String(externalId).slice(0, 512),
    sourceUrl,
    title: (title || '').slice(0, 1024),
    description: (desc || '').slice(0, 50000),
    company: (company || '').slice(0, 512),
    location: (location || '').slice(0, 512),
    link: (link || '').slice(0, 2048),
    publishedAt: parseDate(pubDate),
    raw: item,
  };
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
