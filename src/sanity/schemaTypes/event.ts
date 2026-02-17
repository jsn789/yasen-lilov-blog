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
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (rule) => rule.required().min(2000).max(2100),
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
      rows: 2,
      description: 'Optional longer description of the event or talk',
    }),
    defineField({
      name: 'link',
      title: 'Event link',
      type: 'url',
      description: 'Link to event page, slides, or recording',
    }),
  ],
  orderings: [
    {
      title: 'Year (newest first)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'topic',
      year: 'year',
    },
    prepare({ title, subtitle, year }) {
      return {
        title: `${title} (${year})`,
        subtitle,
      };
    },
  },
});
