import { type SchemaTypeDefinition } from 'sanity';
import { post } from './schemaTypes/post';
import { event } from './schemaTypes/event';
import { tag } from './schemaTypes/tag';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [post, event, tag],
};
