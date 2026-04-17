import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const corpusRoot = path.join(repoRoot, 'corpus');
const episodesRoot = path.join(corpusRoot, 'episodes');
const versesRoot = path.join(corpusRoot, 'verses');
const placeholderRoot = path.join(corpusRoot, 'placeholder');

function readJsonArray(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${filePath}`);
  }
  return parsed;
}

function collectJsonFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function dedupeById(items, idKey) {
  const seen = new Map();
  for (const item of items) {
    const id = item[idKey];
    if (!id || typeof id !== 'string') {
      throw new Error(`Missing or invalid ${idKey}: ${JSON.stringify(item)}`);
    }
    seen.set(id, item);
  }
  return Array.from(seen.values());
}

function build() {
  const episodeFiles = collectJsonFiles(episodesRoot);
  const verseFiles = collectJsonFiles(versesRoot);

  const episodes = dedupeById(
    episodeFiles.flatMap((file) => readJsonArray(file)),
    'episode_id'
  ).sort((a, b) => a.episode_id.localeCompare(b.episode_id));

  const verses = dedupeById(
    verseFiles.flatMap((file) => readJsonArray(file)),
    'id'
  ).sort((a, b) => a.id.localeCompare(b.id));

  fs.mkdirSync(placeholderRoot, { recursive: true });
  fs.writeFileSync(
    path.join(placeholderRoot, 'episodes.json'),
    JSON.stringify(episodes, null, 2) + '\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(placeholderRoot, 'verses.json'),
    JSON.stringify(verses, null, 2) + '\n',
    'utf8'
  );

  console.log(`[Corpus] Wrote ${episodes.length} episodes and ${verses.length} verses`);
}

build();
