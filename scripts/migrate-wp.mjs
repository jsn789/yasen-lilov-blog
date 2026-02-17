/**
 * WordPress → Sanity migration script.
 *
 * Pulls all posts, categories, tags, and images from the WP REST API
 * and pushes them into Sanity.
 *
 * Usage:
 *   SANITY_TOKEN=<your-write-token> node scripts/migrate-wp.mjs
 */

import { createClient } from '@sanity/client';
import { parse } from 'node-html-parser';
import { randomUUID } from 'crypto';

const WP_BASE = 'https://jsndesign.co.uk';
const WP_API = `${WP_BASE}/wp-json/wp/v2`;

const token = process.env.SANITY_TOKEN;
if (!token) {
  console.error('❌  Missing SANITY_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId: 'tize4taj',
  dataset: 'production',
  apiVersion: '2024-07-01',
  token,
  useCdn: false,
});

// ── Helpers ──────────────────────────────────────────────────

function key() {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

async function fetchAll(endpoint) {
  let page = 1;
  let all = [];
  while (true) {
    const res = await fetch(`${WP_API}/${endpoint}?per_page=100&page=${page}`);
    if (!res.ok) break;
    const data = await res.json();
    if (!data.length) break;
    all = all.concat(data);
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1');
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

async function uploadImageToSanity(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';
    const filename = imageUrl.split('/').pop() || 'image.png';
    const asset = await client.assets.upload('image', Buffer.from(buffer), {
      filename,
      contentType,
    });
    return asset._id;
  } catch (err) {
    console.warn(`   ⚠️  Failed to upload image: ${imageUrl} — ${err.message}`);
    return null;
  }
}

// ── HTML → Portable Text Converter ──────────────────────────

function htmlToPortableText(htmlString, imageAssetMap) {
  if (!htmlString) return [];
  const root = parse(htmlString);
  const blocks = [];

  function processChildren(node) {
    const spans = [];
    const markDefs = [];

    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        // Text node
        const text = child.text;
        if (text.trim() || text === ' ') {
          spans.push({ _type: 'span', _key: key(), text, marks: [] });
        }
      } else if (child.nodeType === 1) {
        const tag = child.tagName?.toLowerCase();

        if (tag === 'strong' || tag === 'b') {
          const inner = processChildren(child);
          inner.spans.forEach(s => s.marks.push('strong'));
          spans.push(...inner.spans);
          markDefs.push(...inner.markDefs);
        } else if (tag === 'em' || tag === 'i') {
          const inner = processChildren(child);
          inner.spans.forEach(s => s.marks.push('em'));
          spans.push(...inner.spans);
          markDefs.push(...inner.markDefs);
        } else if (tag === 'code') {
          const inner = processChildren(child);
          inner.spans.forEach(s => s.marks.push('code'));
          spans.push(...inner.spans);
          markDefs.push(...inner.markDefs);
        } else if (tag === 'a') {
          const href = child.getAttribute('href') || '';
          const linkKey = key();
          markDefs.push({
            _type: 'link',
            _key: linkKey,
            href,
            blank: child.getAttribute('target') === '_blank',
          });
          const inner = processChildren(child);
          inner.spans.forEach(s => s.marks.push(linkKey));
          spans.push(...inner.spans);
          markDefs.push(...inner.markDefs);
        } else if (tag === 'br') {
          spans.push({ _type: 'span', _key: key(), text: '\n', marks: [] });
        } else {
          // Inline element — grab its text
          const inner = processChildren(child);
          spans.push(...inner.spans);
          markDefs.push(...inner.markDefs);
        }
      }
    }
    return { spans, markDefs };
  }

  function processNode(node) {
    if (node.nodeType === 3) {
      const text = node.text.trim();
      if (text) {
        blocks.push({
          _type: 'block',
          _key: key(),
          style: 'normal',
          children: [{ _type: 'span', _key: key(), text, marks: [] }],
          markDefs: [],
        });
      }
      return;
    }

    if (node.nodeType !== 1) return;
    const tag = node.tagName?.toLowerCase();

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const style = tag === 'h1' ? 'h2' : tag; // Demote h1 → h2 (post title is h1)
      const { spans, markDefs } = processChildren(node);
      if (spans.length > 0) {
        blocks.push({
          _type: 'block',
          _key: key(),
          style,
          children: spans,
          markDefs,
        });
      }
      return;
    }

    // Paragraphs
    if (tag === 'p') {
      // Check if paragraph contains only an image
      const img = node.querySelector('img');
      if (img && node.childNodes.length <= 2) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const assetId = imageAssetMap.get(src);
        if (assetId) {
          blocks.push({
            _type: 'image',
            _key: key(),
            asset: { _type: 'reference', _ref: assetId },
            alt,
          });
          return;
        }
      }

      const { spans, markDefs } = processChildren(node);
      if (spans.length > 0) {
        blocks.push({
          _type: 'block',
          _key: key(),
          style: 'normal',
          children: spans,
          markDefs,
        });
      }
      return;
    }

    // Blockquotes
    if (tag === 'blockquote') {
      // Process inner paragraphs as blockquote-styled blocks
      for (const child of node.childNodes) {
        if (child.nodeType === 1 && child.tagName?.toLowerCase() === 'p') {
          const { spans, markDefs } = processChildren(child);
          if (spans.length > 0) {
            blocks.push({
              _type: 'block',
              _key: key(),
              style: 'blockquote',
              children: spans,
              markDefs,
            });
          }
        } else if (child.nodeType === 3 && child.text.trim()) {
          blocks.push({
            _type: 'block',
            _key: key(),
            style: 'blockquote',
            children: [{ _type: 'span', _key: key(), text: child.text.trim(), marks: [] }],
            markDefs: [],
          });
        }
      }
      return;
    }

    // Lists (ul / ol)
    if (tag === 'ul' || tag === 'ol') {
      const listType = tag === 'ul' ? 'bullet' : 'number';
      const listItems = node.querySelectorAll(':scope > li');
      for (const li of listItems) {
        const { spans, markDefs } = processChildren(li);
        if (spans.length > 0) {
          blocks.push({
            _type: 'block',
            _key: key(),
            style: 'normal',
            listItem: listType,
            level: 1,
            children: spans,
            markDefs,
          });
        }
      }
      return;
    }

    // Code blocks (pre > code)
    if (tag === 'pre') {
      const codeEl = node.querySelector('code');
      const codeText = codeEl ? codeEl.text : node.text;
      // Try to detect language from class
      const codeClass = codeEl?.getAttribute('class') || node.getAttribute('class') || '';
      const langMatch = codeClass.match(/language-(\w+)/);
      const language = langMatch ? langMatch[1] : 'text';

      blocks.push({
        _type: 'code',
        _key: key(),
        code: codeText.trim(),
        language,
      });
      return;
    }

    // Images (standalone)
    if (tag === 'img') {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      const assetId = imageAssetMap.get(src);
      if (assetId) {
        blocks.push({
          _type: 'image',
          _key: key(),
          asset: { _type: 'reference', _ref: assetId },
          alt,
        });
      }
      return;
    }

    // Figure (often wraps images)
    if (tag === 'figure') {
      const img = node.querySelector('img');
      const figcaption = node.querySelector('figcaption');
      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const caption = figcaption?.text?.trim() || '';
        const assetId = imageAssetMap.get(src);
        if (assetId) {
          blocks.push({
            _type: 'image',
            _key: key(),
            asset: { _type: 'reference', _ref: assetId },
            alt: alt || caption,
            caption,
          });
          return;
        }
      }
    }

    // Divs and other containers — recurse
    if (['div', 'section', 'article', 'main', 'aside', 'span', 'figure'].includes(tag)) {
      for (const child of node.childNodes) {
        processNode(child);
      }
      return;
    }

    // Fallback: try to extract text
    const text = node.text?.trim();
    if (text) {
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'normal',
        children: [{ _type: 'span', _key: key(), text, marks: [] }],
        markDefs: [],
      });
    }
  }

  for (const child of root.childNodes) {
    processNode(child);
  }

  return blocks;
}

// ── Extract image URLs from HTML ────────────────────────────

function extractImageUrls(htmlString) {
  if (!htmlString) return [];
  const root = parse(htmlString);
  const imgs = root.querySelectorAll('img');
  const urls = new Set();
  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (src && src.startsWith('http')) {
      // Use the original/full size URL (remove size suffixes like -300x200)
      const cleanUrl = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
      urls.add(cleanUrl);
      urls.add(src); // Also keep the exact src for mapping
    }
  }
  return [...urls];
}

// ── Category mapping helper ─────────────────────────────────

function mapCategory(wpCatIds, catMap) {
  // Map WP category ID to our Sanity category values
  const mapping = {
    'how-tos': 'How-To',
    'thought-leadership': 'Thought Leadership',
    'google-analytics': 'Google Analytics',
    'tracking-solutions': 'Tracking Solutions',
    'my-projects': 'My Projects',
    'events': 'How-To', // fallback
    'uncategorized': 'How-To', // fallback
  };

  for (const id of wpCatIds) {
    const cat = catMap.get(id);
    if (cat && mapping[cat.slug]) {
      return mapping[cat.slug];
    }
  }
  return 'How-To'; // default fallback
}

// ── Main Migration ──────────────────────────────────────────

async function migrate() {
  console.log('🚀 Starting WordPress → Sanity migration\n');

  // 1. Fetch all WP data
  console.log('📥 Fetching from WordPress REST API...');
  const [wpPosts, wpCategories, wpTags] = await Promise.all([
    fetchAll('posts'),
    fetchAll('categories'),
    fetchAll('tags'),
  ]);
  console.log(`   Posts: ${wpPosts.length}`);
  console.log(`   Categories: ${wpCategories.length}`);
  console.log(`   Tags: ${wpTags.length}\n`);

  // Build lookup maps
  const catMap = new Map(wpCategories.map(c => [c.id, c]));
  const tagMap = new Map(wpTags.map(t => [t.id, t]));

  // 2. Migrate tags to Sanity
  console.log('📌 Migrating tags...');

  // Determine tag sizes based on post count
  const tagPostCount = new Map();
  for (const post of wpPosts) {
    for (const tagId of post.tags) {
      tagPostCount.set(tagId, (tagPostCount.get(tagId) || 0) + 1);
    }
  }

  const tagTransaction = client.transaction();
  for (const t of wpTags) {
    const count = tagPostCount.get(t.id) || 0;
    let size = 'default';
    if (count >= 5) size = 'lg';
    else if (count <= 1) size = 'sm';

    tagTransaction.createOrReplace({
      _id: `tag-${t.slug}`,
      _type: 'tag',
      name: t.name,
      slug: { _type: 'slug', current: t.slug },
      size,
    });
  }
  await tagTransaction.commit();
  console.log(`   ✅ ${wpTags.length} tags migrated\n`);

  // 3. Collect all images from all posts
  console.log('🖼️  Collecting images from posts...');
  const allImageUrls = new Set();
  for (const post of wpPosts) {
    const urls = extractImageUrls(post.content.rendered);
    urls.forEach(u => allImageUrls.add(u));
  }
  console.log(`   Found ${allImageUrls.size} unique image URLs\n`);

  // 4. Upload images to Sanity
  console.log('☁️  Uploading images to Sanity CDN...');
  const imageAssetMap = new Map(); // url → sanity asset ID
  let uploaded = 0;
  let failed = 0;

  for (const url of allImageUrls) {
    const assetId = await uploadImageToSanity(url);
    if (assetId) {
      imageAssetMap.set(url, assetId);
      uploaded++;
      process.stdout.write(`   Uploaded ${uploaded}/${allImageUrls.size}\r`);
    } else {
      failed++;
    }
  }
  console.log(`\n   ✅ ${uploaded} images uploaded, ${failed} failed\n`);

  // 5. Migrate posts
  console.log('📝 Migrating posts...');
  let postCount = 0;

  for (const post of wpPosts) {
    const title = post.title.rendered
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8230;/g, '…')
      .replace(/&nbsp;/g, ' ');

    const excerpt = post.excerpt.rendered
      .replace(/<[^>]+>/g, '') // strip HTML
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '…')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 300);

    const category = mapCategory(post.categories, catMap);
    const tags = post.tags
      .map(id => tagMap.get(id)?.name)
      .filter(Boolean);

    // Convert HTML body to Portable Text
    const body = htmlToPortableText(post.content.rendered, imageAssetMap);

    // Estimate read time
    const wordCount = post.content.rendered.replace(/<[^>]+>/g, '').split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const doc = {
      _id: `post-${post.slug}`,
      _type: 'post',
      title,
      slug: { _type: 'slug', current: post.slug },
      publishedAt: post.date_gmt + 'Z',
      category,
      tags,
      excerpt,
      readTime,
      body,
    };

    // Upload featured image if exists
    if (post.featured_media && post.featured_media > 0) {
      try {
        const mediaRes = await fetch(`${WP_API}/media/${post.featured_media}`);
        if (mediaRes.ok) {
          const media = await mediaRes.json();
          const assetId = imageAssetMap.get(media.source_url) || await uploadImageToSanity(media.source_url);
          if (assetId) {
            doc.mainImage = {
              _type: 'image',
              asset: { _type: 'reference', _ref: assetId },
              alt: media.alt_text || title,
            };
          }
        }
      } catch (err) {
        // Skip featured image on error
      }
    }

    await client.createOrReplace(doc);
    postCount++;
    console.log(`   [${postCount}/${wpPosts.length}] ${title.slice(0, 60)}...`);
  }

  console.log(`\n   ✅ ${postCount} posts migrated\n`);
  console.log('🎉 Migration complete!');
  console.log(`   ${wpTags.length} tags, ${postCount} posts, ${uploaded} images`);
  console.log('   View at: https://www.sanity.io/manage/project/tize4taj');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
