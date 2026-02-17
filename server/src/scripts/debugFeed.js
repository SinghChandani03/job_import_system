/**
 * Debug script to see how xml2js parses a feed. Run:
 *   node src/scripts/debugFeed.js "https://jobicy.com/?feed=job_feed"
 */
import 'dotenv/config';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const url = process.argv[2] || 'https://jobicy.com/?feed=job_feed';

function shape(obj, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return '...';
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return [];
    return [shape(obj[0], depth + 1, maxDepth)];
  }
  if (typeof obj === 'string') return obj.length > 60 ? obj.slice(0, 60) + '...' : obj;
  if (typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    out[k] = shape(obj[k], depth + 1, maxDepth);
  }
  return out;
}

async function main() {
  console.log('Fetching:', url);
  const { data } = await axios.get(url, {
    timeout: 15000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      Accept: 'application/xml, text/xml, application/rss+xml, */*',
      Referer: new URL(url).origin + '/',
    },
  });
  const xml = typeof data === 'string' ? data : String(data);
  console.log('Response length:', xml.length);
  console.log('Starts with:', xml.slice(0, 80));
  const parsed = await parseStringPromise(xml, {
    explicitArray: true,
    trim: true,
    ignoreAttrs: false,
    strict: false,
  });
  console.log('\nParsed top-level keys:', Object.keys(parsed));
  console.log('\nShape (first 2 levels):', JSON.stringify(shape(parsed, 0, 2), null, 2));
  const rootKey = Object.keys(parsed)[0];
  const root = parsed[rootKey];
  const rootObj = Array.isArray(root) ? root[0] : root;
  console.log('\nRoot object keys:', rootObj ? Object.keys(rootObj) : 'none');
  if (rootObj?.channel) {
    const ch = rootObj.channel;
    const ch0 = Array.isArray(ch) ? ch[0] : ch;
    console.log('Channel keys:', ch0 ? Object.keys(ch0) : 'none');
    const itemList = ch0?.ITEM ?? ch0?.item;
    const items = Array.isArray(itemList) ? itemList : itemList ? [itemList] : [];
    if (items.length) {
      console.log('Number of items:', items.length);
      console.log('First item keys:', Object.keys(items[0]));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
