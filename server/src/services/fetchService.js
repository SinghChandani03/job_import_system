import axios from 'axios';
import { xmlToJson, extractItemsFromParsedXml, mapRssItemToJob } from '../helpers/xmlParser.js';

const HTTP_TIMEOUT_MS = 30000;

/**
 * Fetch XML from URL and return raw string.
 */
export async function fetchXml(url) {
  const { data } = await axios.get(url, {
    timeout: HTTP_TIMEOUT_MS,
    responseType: 'text',
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/xml, text/xml, application/rss+xml, */*',
      Referer: new URL(url).origin + '/',
    },
  });
  return typeof data === 'string' ? data : String(data);
}

/**
 * Fetch jobs from a single API URL (XML/RSS), convert to JSON, return normalized job list.
 */
export async function fetchJobsFromUrl(sourceUrl) {
  const xml = await fetchXml(sourceUrl);
  const trimmed = typeof xml === 'string' ? xml.trim() : String(xml);
  if (!trimmed) throw new Error('Feed returned empty response.');
  if (/^\s*<!DOCTYPE|^\s*<html/i.test(trimmed)) {
    throw new Error('Feed returned HTML instead of XML (site may block automated requests). Try opening the URL in a browser.');
  }
  let parsed;
  try {
    parsed = await xmlToJson(trimmed);
  } catch (err) {
    throw new Error(`Feed returned invalid XML: ${err.message || 'parse error'}. Try another job source.`);
  }
  const items = extractItemsFromParsedXml(parsed);
  if (items.length === 0) {
    const looksLikeXml = /^\s*<\?xml|^\s*<rss|^\s*<feed/i.test(trimmed);
    throw new Error(
      looksLikeXml
        ? 'Feed was received but no <item> elements were found. The feed format may differ from expected.'
        : `Feed returned no job items (received ${trimmed.length} characters).`
    );
  }
  return items.map((item) => mapRssItemToJob(item, sourceUrl));
}
