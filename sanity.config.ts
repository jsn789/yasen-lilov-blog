import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { codeInput } from '@sanity/code-input';
import { schema } from './src/sanity/schema';

export default defineConfig({
  name: 'yasen-blog',
  title: 'Yasen Lilov — Blog & Site',
  projectId: 'tize4taj',
  dataset: 'production',
  plugins: [structureTool(), codeInput()],
  schema,
});
