import { sanityClient } from 'sanity:client';
import imageUrlBuilder from '@sanity/image-url';
import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';

// Image URL helper
const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any): ImageUrlBuilder {
  return builder.image(source);
}

// ── Blog Posts ──────────────────────────────────────────────

export async function getAllPosts() {
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      tags,
      excerpt,
      readTime,
      mainImage
    }`
  );
}

export async function getRecentPosts(limit = 6) {
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      tags,
      excerpt
    }`,
    { limit }
  );
}

export async function getPostBySlug(slug: string) {
  return sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      category,
      tags,
      excerpt,
      readTime,
      mainImage,
      body
    }`,
    { slug }
  );
}

export async function getPostSlugs() {
  return sanityClient.fetch(
    `*[_type == "post"] { "slug": slug.current }`
  );
}

// ── Speaking Events ─────────────────────────────────────────

export async function getAllEvents() {
  return sanityClient.fetch(
    `*[_type == "event"] | order(date desc) {
      _id,
      title,
      date,
      year,
      location,
      eventType,
      topic,
      description,
      link,
      slidesEmbed
    }`
  );
}

// ── Expertise Tags ──────────────────────────────────────────

export async function getAllTags() {
  return sanityClient.fetch(
    `*[_type == "tag"] | order(name asc) {
      _id,
      name,
      "slug": slug.current,
      size
    }`
  );
}

// ── Helpers ─────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
