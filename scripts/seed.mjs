/**
 * Seed script — pushes initial content into Sanity.
 *
 * Usage:
 *   SANITY_TOKEN=<your-write-token> node scripts/seed.mjs
 *
 * Get a write token from: https://www.sanity.io/manage/project/tize4taj → API → Tokens → Add API token (Editor role)
 */

import { createClient } from '@sanity/client';

const token = process.env.SANITY_TOKEN;
if (!token) {
  console.error('❌  Missing SANITY_TOKEN environment variable.');
  console.error('   Get a write token from: https://www.sanity.io/manage/project/tize4taj → API → Tokens');
  process.exit(1);
}

const client = createClient({
  projectId: 'tize4taj',
  dataset: 'production',
  apiVersion: '2024-07-01',
  token,
  useCdn: false,
});

// ── Tags (expertise cloud) ──────────────────────────────────
const tags = [
  { name: 'AI', slug: 'ai', size: 'default' },
  { name: 'Analytics', slug: 'analytics', size: 'default' },
  { name: 'AngularJS', slug: 'angularjs', size: 'sm' },
  { name: 'APIs', slug: 'apis', size: 'default' },
  { name: 'Architecture', slug: 'architecture', size: 'default' },
  { name: 'Automation', slug: 'automation', size: 'default' },
  { name: 'Beacon API', slug: 'beacon-api', size: 'sm' },
  { name: 'BigQuery', slug: 'bigquery', size: 'default' },
  { name: 'Bootstrap', slug: 'bootstrap', size: 'sm' },
  { name: 'CRISP-DM', slug: 'crisp-dm', size: 'sm' },
  { name: 'CSS', slug: 'css', size: 'sm' },
  { name: 'Data Mining', slug: 'data-mining', size: 'sm' },
  { name: 'eCommerce', slug: 'ecommerce', size: 'sm' },
  { name: 'GA4', slug: 'ga4', size: 'lg' },
  { name: 'GA Core Reporting API', slug: 'ga-core-reporting-api', size: 'sm' },
  { name: 'GA Management API', slug: 'ga-management-api', size: 'sm' },
  { name: 'GA Measurement Protocol', slug: 'ga-measurement-protocol', size: 'default' },
  { name: 'Google Ads', slug: 'google-ads', size: 'default' },
  { name: 'Google Analytics', slug: 'google-analytics', size: 'lg' },
  { name: 'GTM', slug: 'gtm', size: 'lg' },
  { name: 'HTML', slug: 'html', size: 'sm' },
  { name: 'HTTP', slug: 'http', size: 'sm' },
  { name: 'JavaScript', slug: 'javascript', size: 'lg' },
  { name: 'jQuery', slug: 'jquery', size: 'sm' },
  { name: 'JSON', slug: 'json', size: 'sm' },
  { name: 'Machine Learning', slug: 'machine-learning', size: 'default' },
  { name: 'MySQL', slug: 'mysql', size: 'sm' },
  { name: 'PHP', slug: 'php', size: 'sm' },
  { name: 'Plugins', slug: 'plugins', size: 'sm' },
  { name: 'PMF', slug: 'pmf', size: 'sm' },
  { name: 'Predictive Modelling', slug: 'predictive-modelling', size: 'sm' },
  { name: 'Privacy', slug: 'privacy', size: 'default' },
  { name: 'Productivity', slug: 'productivity', size: 'sm' },
  { name: 'Programming', slug: 'programming', size: 'default' },
  { name: 'Psychology', slug: 'psychology', size: 'sm' },
  { name: 'QA', slug: 'qa', size: 'default' },
  { name: 'RegEx', slug: 'regex', size: 'sm' },
  { name: 'Segment', slug: 'segment', size: 'lg' },
  { name: 'Single-Page Applications', slug: 'single-page-applications', size: 'sm' },
  { name: 'Strategy', slug: 'strategy', size: 'default' },
  { name: 'VR', slug: 'vr', size: 'sm' },
  { name: 'WordPress', slug: 'wordpress', size: 'sm' },
  { name: 'YouTube Data API', slug: 'youtube-data-api', size: 'sm' },
];

// ── Speaking Events ──────────────────────────────────────────
const events = [
  { title: 'MeasureCamp London', year: 2024, eventType: 'Unconference', topic: 'AI-Powered Analytics Workflows' },
  { title: 'Google B2B Growth Bootcamp', year: 2024, eventType: 'Workshop', topic: 'GA4 Implementation & Strategy' },
  { title: 'SuperWeek Hungary', year: 2023, eventType: 'Conference', topic: 'GA4 Server-Side Tracking in Practice' },
  { title: 'Analytics Summit', year: 2023, eventType: 'Conference', topic: 'Building a Measurement Framework That Scales' },
  { title: 'MeasureCamp London', year: 2023, eventType: 'Unconference', topic: 'Google Consent Mode v2 — What You Need to Know' },
  { title: 'AUBG — American University in Bulgaria', year: 2023, eventType: 'Guest Lecture', topic: 'Digital Analytics & Career Paths in Data' },
];

// ── Sample Blog Posts ────────────────────────────────────────
const posts = [
  {
    title: 'Segment Implementation Deep-Dive [Part 1]: Architecture & Tracking Plan',
    slug: 'segment-implementation-deep-dive',
    publishedAt: '2025-06-15T09:00:00Z',
    category: 'How-To',
    tags: ['Segment', 'CDP', 'Architecture'],
    excerpt: 'A practical walkthrough of implementing Segment from scratch — covering architecture decisions, tracking plan design, and source configuration.',
    readTime: '12 min read',
    body: [
      { _type: 'block', _key: 'intro1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'This is a sample post to demonstrate the blog layout. Full content will come from the WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
  {
    title: 'Test, Don\'t Guess: Data Analytics and Paid Ads for Faster PMF',
    slug: 'test-dont-guess',
    publishedAt: '2025-03-20T09:00:00Z',
    category: 'Thought Leadership',
    tags: ['Analytics', 'Paid Ads', 'Startups'],
    excerpt: 'How startups can use analytics and paid acquisition together to find product-market fit without burning cash on guesswork.',
    readTime: '8 min read',
    body: [
      { _type: 'block', _key: 'intro2', style: 'normal', children: [{ _type: 'span', _key: 's2', text: 'Sample content — full article coming after WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
  {
    title: 'How AI is Reshaping Digital Marketing Analytics',
    slug: 'ai-reshaping-marketing-analytics',
    publishedAt: '2025-03-18T09:00:00Z',
    category: 'Thought Leadership',
    tags: ['AI', 'Marketing', 'Analytics'],
    excerpt: 'AI isn\'t replacing analysts — it\'s changing the questions we ask and the speed at which we can answer them.',
    readTime: '7 min read',
    body: [
      { _type: 'block', _key: 'intro3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Sample content — full article coming after WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
  {
    title: 'GA4 Server-Side Tracking and the Future of Web Analytics',
    slug: 'ga4-server-side-tracking',
    publishedAt: '2025-03-15T09:00:00Z',
    category: 'How-To',
    tags: ['GA4', 'Server-Side', 'GTM'],
    excerpt: 'Server-side tagging is becoming essential. Here\'s how GA4 server-side works, when you need it, and how to set it up properly.',
    readTime: '10 min read',
    body: [
      { _type: 'block', _key: 'intro4', style: 'normal', children: [{ _type: 'span', _key: 's4', text: 'Sample content — full article coming after WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
  {
    title: 'Beyond Automation: The Rise of AI Agents in Service Businesses',
    slug: 'ai-agents-service-businesses',
    publishedAt: '2025-03-12T09:00:00Z',
    category: 'Thought Leadership',
    tags: ['AI Agents', 'Automation'],
    excerpt: 'AI agents are moving beyond chatbots. What happens when they can reason, plan, and execute multi-step business processes?',
    readTime: '9 min read',
    body: [
      { _type: 'block', _key: 'intro5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Sample content — full article coming after WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
  {
    title: 'GA4 Data Redaction: Clean PII in a Simple Way',
    slug: 'ga4-data-redaction',
    publishedAt: '2023-10-10T09:00:00Z',
    category: 'How-To',
    tags: ['GA4', 'Privacy', 'PII'],
    excerpt: 'A straightforward approach to keeping personally identifiable information out of your GA4 data without overcomplicating your setup.',
    readTime: '6 min read',
    body: [
      { _type: 'block', _key: 'intro6', style: 'normal', children: [{ _type: 'span', _key: 's6', text: 'Sample content — full article coming after WordPress migration.', marks: [] }], markDefs: [] },
    ],
  },
];

// ── Seed ──────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Sanity...\n');

  // Tags
  console.log(`📌 Seeding ${tags.length} tags...`);
  const tagTransaction = client.transaction();
  for (const t of tags) {
    tagTransaction.createOrReplace({
      _id: `tag-${t.slug}`,
      _type: 'tag',
      name: t.name,
      slug: { _type: 'slug', current: t.slug },
      size: t.size,
    });
  }
  await tagTransaction.commit();
  console.log(`   ✅ ${tags.length} tags seeded\n`);

  // Events
  console.log(`🎤 Seeding ${events.length} events...`);
  const eventTransaction = client.transaction();
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    eventTransaction.createOrReplace({
      _id: `event-${e.year}-${i}`,
      _type: 'event',
      title: e.title,
      year: e.year,
      eventType: e.eventType,
      topic: e.topic,
    });
  }
  await eventTransaction.commit();
  console.log(`   ✅ ${events.length} events seeded\n`);

  // Posts
  console.log(`📝 Seeding ${posts.length} posts...`);
  const postTransaction = client.transaction();
  for (const p of posts) {
    postTransaction.createOrReplace({
      _id: `post-${p.slug}`,
      _type: 'post',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      publishedAt: p.publishedAt,
      category: p.category,
      tags: p.tags,
      excerpt: p.excerpt,
      readTime: p.readTime,
      body: p.body,
    });
  }
  await postTransaction.commit();
  console.log(`   ✅ ${posts.length} posts seeded\n`);

  console.log('🎉 Done! Content is live in Sanity.');
  console.log('   View it at: https://www.sanity.io/manage/project/tize4taj');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
