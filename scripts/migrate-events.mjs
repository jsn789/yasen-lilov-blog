/**
 * Events migration script — parses speaking events from the WP about page
 * accordion and pushes them into Sanity.
 *
 * Usage:
 *   SANITY_TOKEN=<your-write-token> node scripts/migrate-events.mjs
 */

import { createClient } from '@sanity/client';
import { parse } from 'node-html-parser';

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

// ── Helpers ────────────────────────────────────────────────

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&#038;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .trim();
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function classifyEventType(title, description) {
  const t = title.toLowerCase();
  const d = (description || '').toLowerCase();

  if (t.includes('measurecamp') || t.includes('unconference') || d.includes('unconference'))
    return 'Unconference';
  if (t.includes('guest lecture') || t.includes('aubg'))
    return 'Guest Lecture';
  if (t.includes('webinar') || t.includes('online'))
    return 'Webinar';
  if (t.includes('workshop') || t.includes('bootcamp'))
    return 'Workshop';
  if (t.includes('hackathon') || t.includes('studenthack') || t.includes('code for good'))
    return 'Hackathon';
  if (t.includes('award'))
    return 'Award';
  if (t.includes('kapital') || t.includes('summit') || t.includes('cloud next') || t.includes('big data'))
    return 'Conference';
  if (t.includes('vertotalks'))
    return 'Meetup';
  if (t.includes('linkedin'))
    return 'Conference';
  if (t.includes('google'))
    return 'Workshop';
  if (t.includes('telerik') || t.includes('mini mba'))
    return 'Guest Lecture';

  return 'Conference'; // fallback
}

// ── Parse accordion events ─────────────────────────────────

function parseEvents(html) {
  const root = parse(html);
  const groups = root.querySelectorAll('.x-accordion-group');
  const events = [];

  for (const group of groups) {
    const toggleEl = group.querySelector('.x-accordion-toggle');
    const bodyEl = group.querySelector('.x-accordion-inner');

    if (!toggleEl) continue;

    const rawTitle = decodeHtmlEntities(toggleEl.text.trim());

    // Parse title format: "Event Name 'YY - Location"
    // Examples:
    //   "MeasureCamp London '24 - London, UK"
    //   "Kapital - AI Agents in service-based businesses '25 - Sofia, Bulgaria"
    //   "StudentHack - '14 - Manchester, UK"

    let eventName = rawTitle;
    let year = null;
    let location = '';

    // Extract year: look for 'YY pattern
    const yearMatch = rawTitle.match(/'(\d{2})\b/);
    if (yearMatch) {
      const shortYear = parseInt(yearMatch[1]);
      year = shortYear >= 50 ? 1900 + shortYear : 2000 + shortYear;
    }

    // Split on the year marker to get name and location
    const yearPattern = /\s*'(\d{2})\s*/;
    const parts = rawTitle.split(yearPattern);
    if (parts.length >= 1) {
      eventName = parts[0].replace(/\s*-\s*$/, '').trim();
    }
    // Location is everything after the year
    if (parts.length >= 3) {
      location = parts[2].replace(/^\s*-\s*/, '').trim();
    }

    // Extract description text (strip HTML tags)
    let description = '';
    let link = '';
    let slidesEmbed = '';

    if (bodyEl) {
      // Get the first link as event link
      const links = bodyEl.querySelectorAll('a');
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        if (href && href !== '#share' && !href.startsWith('#') && href.startsWith('http')) {
          link = href;
          break;
        }
      }

      // Get slides/video embed URL
      const iframe = bodyEl.querySelector('iframe');
      if (iframe) {
        const src = iframe.getAttribute('src') || '';
        if (src) {
          // Normalize the URL
          slidesEmbed = src.startsWith('//') ? 'https:' + src : src;
        }
      }

      // Extract plain text description (strip all HTML)
      let descText = bodyEl.innerHTML
        // Remove iframes
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        // Remove images
        .replace(/<img[^>]*\/?>/gi, '')
        // Remove links but keep text
        .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
        // Convert <p> and <br> to newlines
        .replace(/<\/p>\s*<p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        // Strip remaining tags
        .replace(/<[^>]+>/g, '')
        // Decode entities
        .replace(/&amp;/g, '&')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8230;/g, '…')
        .replace(/&#038;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Remove "Copy of the slides can be found here" type suffixes
      descText = descText
        .replace(/Copy of the slides can be found\s*here\.?/gi, '')
        .replace(/Here are the slides:?\s*/gi, '')
        .replace(/Below you can see the slides from the event:?\s*/gi, '')
        .trim();

      description = descText;
    }

    const eventType = classifyEventType(eventName, description);

    events.push({
      eventName,
      year,
      location,
      eventType,
      description,
      link,
      slidesEmbed,
    });
  }

  return events;
}

// ── Main ───────────────────────────────────────────────────

async function migrate() {
  console.log('🎤 Migrating speaking events from WordPress about page\n');

  // 1. Fetch the about page
  console.log('📥 Fetching WordPress about page...');
  const res = await fetch('https://jsndesign.co.uk/wp-json/wp/v2/pages?slug=about');
  if (!res.ok) {
    throw new Error(`Failed to fetch about page: ${res.status}`);
  }
  const pages = await res.json();
  if (!pages.length) {
    throw new Error('About page not found');
  }
  const html = pages[0].content.rendered;
  console.log('   ✅ Page fetched\n');

  // 2. Parse events from accordion
  console.log('🔍 Parsing accordion events...');
  const events = parseEvents(html);
  console.log(`   Found ${events.length} events\n`);

  // 3. Delete old placeholder events first
  console.log('🗑️  Removing old placeholder events...');
  const oldEvents = await client.fetch('*[_type == "event"]._id');
  if (oldEvents.length > 0) {
    const delTransaction = client.transaction();
    for (const id of oldEvents) {
      delTransaction.delete(id);
    }
    await delTransaction.commit();
    console.log(`   Deleted ${oldEvents.length} old events\n`);
  }

  // 4. Assign synthetic dates based on accordion position
  // The WP accordion lists events most-recent-first (top → bottom).
  // Within each year, assign months from 12 down to 1 to preserve ordering.
  console.log('📅 Assigning synthetic dates...');
  const yearCounters = new Map(); // year → next month to assign (starts at 12, decrements)

  for (const evt of events) {
    if (!evt.year) continue;
    const monthsUsed = yearCounters.get(evt.year) || 0;
    const month = 12 - monthsUsed; // first event in year gets month 12, next gets 11, etc.
    evt.date = `${evt.year}-${String(Math.max(1, month)).padStart(2, '0')}-01`;
    yearCounters.set(evt.year, monthsUsed + 1);
  }

  // 5. Push events to Sanity
  console.log('📝 Pushing events to Sanity...');
  const transaction = client.transaction();
  let count = 0;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    if (!evt.year) {
      console.warn(`   ⚠️  Skipping event without year: ${evt.eventName}`);
      continue;
    }

    const id = `event-${String(i).padStart(2, '0')}-${evt.year}-${slugify(evt.eventName)}`;

    const doc = {
      _id: id,
      _type: 'event',
      title: evt.eventName,
      date: evt.date,
      year: evt.year,
      location: evt.location || undefined,
      eventType: evt.eventType,
      description: evt.description || undefined,
      link: evt.link || undefined,
      slidesEmbed: evt.slidesEmbed || undefined,
    };

    transaction.createOrReplace(doc);
    count++;
    console.log(`   [${count}] ${evt.eventName} (${evt.date}) — ${evt.location || 'no location'}`);
  }

  await transaction.commit();
  console.log(`\n   ✅ ${count} events migrated\n`);
  console.log('🎉 Done! Events are live in Sanity.');
  console.log('   View at: https://www.sanity.io/manage/project/tize4taj');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
