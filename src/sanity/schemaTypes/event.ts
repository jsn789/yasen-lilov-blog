import { defineField, defineType } from 'sanity';

export const event = defineType({
  name: 'event',
  title: 'Speaking Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Event date',
      type: 'date',
      description: 'Used for ordering. Only the year is displayed on the site.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Auto-derived from date. Kept for convenience.',
      validation: (rule) => rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'City, Country (e.g. London, UK)',
    }),
    defineField({
      name: 'eventType',
      title: 'Event type',
      type: 'string',
      options: {
        list: [
          { title: 'Conference', value: 'Conference' },
          { title: 'Unconference', value: 'Unconference' },
          { title: 'Workshop', value: 'Workshop' },
          { title: 'Webinar', value: 'Webinar' },
          { title: 'Guest Lecture', value: 'Guest Lecture' },
          { title: 'Meetup', value: 'Meetup' },
          { title: 'Hackathon', value: 'Hackathon' },
          { title: 'Award', value: 'Award' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Talk topic',
      type: 'string',
      description: 'The title or topic of your talk',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Description of the event or talk',
    }),
    defineField({
      name: 'link',
      title: 'Event link',
      type: 'url',
      description: 'Link to event page, slides, or recording',
    }),
    defineField({
      name: 'slidesEmbed',
      title: 'Slides embed URL',
      type: 'url',
      description: 'SlideShare or YouTube embed URL for presentation slides',
      validation: (rule) => rule.uri({ allowRelative: true }),
    }),
  ],
  orderings: [
    {
      title: 'Date (newest first)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'topic',
      year: 'year',
      location: 'location',
    },
    prepare({ title, subtitle, year, location }) {
      return {
        title: `${title} (${year})`,
        subtitle: subtitle || location || '',
      };
    },
  },
});
