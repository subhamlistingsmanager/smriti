import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(repoRoot, 'corpus', 'comprehensive', 'episodes');

const RAMAYANA_URL = 'https://www.gutenberg.org/files/24869/24869-0.txt';
const MAHABHARATA_URLS = [
  'https://archive.org/download/the-mahabharata-with-bhagavad-gita-harivamsa-complete-prose-version-kisari-mohan/THE%20MAHABHARATA%20with%20Bhagavad%20Gita%20%26%20Harivamsa%2C%20Complete%20Prose%20Version%2C%20Kisari%20Mohan%20Ganguli%2C%201896%2C%20Lord%20Henfield%20Edition%202024.doc_djvu.txt',
  'https://archive.org/download/TheMahabharata_201707/TheMahabharata_djvu.txt'
];

const TMP_RAMAYANA = '/tmp/ramayan_24869_full.txt';
const TMP_MAHABHARATA = '/tmp/mahabharata_ganguli_full.txt';

const CHARACTER_CUES = [
  'rama', 'sita', 'lakshmana', 'bharata', 'hanuman', 'ravana', 'kaikeyi', 'dasharatha',
  'krishna', 'arjuna', 'bhima', 'yudhishthira', 'nakula', 'sahadeva', 'draupadi', 'karna',
  'duryodhana', 'bhishma', 'drona', 'vidura', 'kunti', 'gandhari', 'dhritarashtra',
  'abhimanyu', 'subhadra', 'parikshit', 'janamejaya', 'sanjaya', 'vasudeva', 'devaki'
];

const THEME_RULES = [
  { re: /dharma|duty|vow|oath|promise/i, theme: 'dharma and duty', emo: 'choosing duty under pressure' },
  { re: /war|battle|fight|slay|weapon|arrow/i, theme: 'conflict and courage', emo: 'facing fear in confrontation' },
  { re: /exile|forest|wandering|banish/i, theme: 'exile and endurance', emo: 'living through long uncertainty' },
  { re: /grief|lament|sorrow|tears/i, theme: 'grief and resilience', emo: 'holding pain without collapsing' },
  { re: /king|kingdom|throne|rule|crown/i, theme: 'power and responsibility', emo: 'bearing leadership burden' },
  { re: /devotion|prayer|worship|boon|blessing/i, theme: 'devotion and grace', emo: 'seeking strength through faith' },
  { re: /counsel|advice|speech|teaching|gita/i, theme: 'wisdom and counsel', emo: 'needing clarity in confusion' }
];

function shell(command) {
  execSync(command, { stdio: 'pipe' });
}

function download(urlOrUrls, outFile) {
  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) {
    return;
  }

  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  let ok = false;
  let lastError = '';

  for (const url of urls) {
    try {
      shell(`curl -L -s '${url}' -o '${outFile}'`);
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) {
        ok = true;
        break;
      }
    } catch (error) {
      lastError = String(error);
    }
  }

  if (!ok) {
    throw new Error(`Download failed or too small: ${urls.join(' | ')} ${lastError}`);
  }
}

function romanToInt(roman) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = map[roman[i]] || 0;
    total += val < prev ? -val : val;
    prev = val;
  }
  return total;
}

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s.]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'segment';
}

function detectCharacters(text) {
  const lower = text.toLowerCase();
  const found = CHARACTER_CUES.filter((name) => lower.includes(name));
  const pretty = found.map((n) => n[0].toUpperCase() + n.slice(1));
  return pretty.length > 0 ? pretty.slice(0, 10) : ['Narrative'];
}

function detectThemesAndEmotions(text) {
  const themes = [];
  const emos = [];
  for (const rule of THEME_RULES) {
    if (rule.re.test(text)) {
      themes.push(rule.theme);
      emos.push(rule.emo);
    }
  }
  if (themes.length === 0) {
    themes.push('epic narrative continuity');
    emos.push('searching for meaning in a long story');
  }
  return { themes: Array.from(new Set(themes)), emos: Array.from(new Set(emos)) };
}

function compactExcerpt(text, max = 1200) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}...`;
}

function parseRamayanaEpisodes(raw) {
  const lines = raw.split(/\r?\n/);
  const startMarker = lines.findIndex((l) => l.includes('***START OF THE PROJECT GUTENBERG EBOOK'));
  const work = lines.slice(Math.max(startMarker + 1, 0));

  const episodes = [];
  let currentBook = 'Book Unknown';
  let currentBookSlug = 'book_unknown';
  let currentCanto = null;
  let buffer = [];

  function flush() {
    if (!currentCanto) return;
    const text = buffer.join('\n').trim();
    if (text.length < 900) return;

    const { themes, emos } = detectThemesAndEmotions(text);
    const characters = detectCharacters(text);
    const summary = `This canto narrates a continuous segment of the ${currentBook} storyline: ${currentCanto.title}. It preserves sequence-level context for full-epic retrieval.`;

    episodes.push({
      episode_id: `ram.full.${currentBookSlug}.canto_${String(currentCanto.number).padStart(3, '0')}_${slugify(currentCanto.title)}`,
      source_text: 'ramayan',
      kanda_parva: `${currentBook}, Canto ${currentCanto.roman}. ${currentCanto.title}`,
      characters,
      location: 'Multiple locations across the Ramayana narrative',
      summary_en: summary,
      source_excerpt: compactExcerpt(text),
      themes,
      emotional_situations: emos,
      linked_verses: [],
      source_ref: {
        title: 'The Ramayan of Valmiki, tr. R.T.H. Griffith',
        url: RAMAYANA_URL,
        locator: `${currentBook}, Canto ${currentCanto.roman}`
      }
    });
  }

  for (const line of work) {
    const bookMatch = line.match(/^BOOK\s+([IVXLCDM]+)\.?\s*$/i);
    if (bookMatch) {
      currentBook = `Book ${bookMatch[1].toUpperCase()}`;
      currentBookSlug = `book_${romanToInt(bookMatch[1].toUpperCase()) || bookMatch[1].toLowerCase()}`;
      continue;
    }

    const cantoMatch = line.match(/^Canto\s+([IVXLCDM]+)\.\s*(.+?)\.?\s*$/i);
    if (cantoMatch) {
      flush();
      currentCanto = {
        roman: cantoMatch[1].toUpperCase(),
        number: romanToInt(cantoMatch[1].toUpperCase()) || 0,
        title: cantoMatch[2].trim()
      };
      buffer = [];
      continue;
    }

    if (currentCanto) {
      buffer.push(line);
    }
  }

  flush();
  return episodes;
}

function parseMahabharataEpisodes(raw) {
  const PARVA_NAMES = [
    'ADI',
    'SABHA',
    'VANA',
    'VIRATA',
    'UDYOGA',
    'BHISHMA',
    'DRONA',
    'KARNA',
    'SHALYA',
    'SAUPTIKA',
    'STRI',
    'SHANTI',
    'ANUSHASANA',
    'ASHVAMEDHIKA',
    'ASHRAMAVASIKA',
    'MAUSALA',
    'MAHAPRASTHANIKA',
    'SVARGAROHANA',
    'HARIVAMSA'
  ];

  const normalized = raw.replace(/\r/g, '');
  const firstSection = normalized.search(/\bSECTION\s+I\b/i);
  const work = firstSection > 0 ? normalized.slice(firstSection) : normalized;

  const episodes = [];
  let currentParva = 'Mahabharata';
  let sectionCounter = 0;

  const sectionRegex = /\bSECTION\s+([IVXLCDM]+(?:\([^)]+\))?|\d+)\b/gi;
  const matches = [...work.matchAll(sectionRegex)];

  // Some mirrors have sparse heading OCR. In that case, fall back to
  // continuous chunking so the entire narrative is still represented.
  if (matches.length < 200) {
    const paragraphs = work
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 40);

    const target = 4500;
    let chunkIndex = 0;
    let buf = '';

    for (const para of paragraphs) {
      if ((buf + '\n\n' + para).length > target && buf.length > 0) {
        const { themes, emos } = detectThemesAndEmotions(buf);
        const characters = detectCharacters(buf);
        chunkIndex += 1;
        episodes.push({
          episode_id: `mbh.full.seq_${String(chunkIndex).padStart(5, '0')}`,
          source_text: 'mahabharat',
          kanda_parva: `Mahabharata Continuous Narrative Chunk ${chunkIndex}`,
          characters,
          location: 'Multiple locations across the Mahabharata narrative',
          summary_en: 'This sequential chunk preserves continuous Mahabharata narrative flow for complete-story retrieval.',
          source_excerpt: compactExcerpt(buf),
          themes,
          emotional_situations: emos,
          linked_verses: [],
          source_ref: {
            title: 'Mahabharata, Ganguli complete prose (Archive mirror)',
            url: MAHABHARATA_URLS[0],
            locator: `Continuous chunk ${chunkIndex}`
          }
        });
        buf = para;
      } else {
        buf = buf ? `${buf}\n\n${para}` : para;
      }
    }

    if (buf.length > 0) {
      const { themes, emos } = detectThemesAndEmotions(buf);
      const characters = detectCharacters(buf);
      chunkIndex += 1;
      episodes.push({
        episode_id: `mbh.full.seq_${String(chunkIndex).padStart(5, '0')}`,
        source_text: 'mahabharat',
        kanda_parva: `Mahabharata Continuous Narrative Chunk ${chunkIndex}`,
        characters,
        location: 'Multiple locations across the Mahabharata narrative',
        summary_en: 'This sequential chunk preserves continuous Mahabharata narrative flow for complete-story retrieval.',
        source_excerpt: compactExcerpt(buf),
        themes,
        emotional_situations: emos,
        linked_verses: [],
        source_ref: {
          title: 'Mahabharata, Ganguli complete prose (Archive mirror)',
          url: MAHABHARATA_URLS[0],
          locator: `Continuous chunk ${chunkIndex}`
        }
      });
    }

    return episodes;
  }

  for (let i = 0; i < matches.length; i++) {
    const sectionMatch = matches[i];
    const next = matches[i + 1];
    const start = sectionMatch.index;
    const end = next ? next.index : work.length;
    const text = work.slice(start, end).trim();

    if (text.length < 250) {
      continue;
    }

    // Infer current parva from nearby context before section heading.
    const contextStart = Math.max(0, start - 5000);
    const context = work.slice(contextStart, start);
    for (const name of PARVA_NAMES) {
      const re = new RegExp(`\\b${name}\\s+PARVA\\b`, 'i');
      if (re.test(context)) {
        currentParva = `${name[0]}${name.slice(1).toLowerCase()} Parva`;
      }
    }

    const sectionId = sectionMatch[1].toUpperCase();
    const currentSection = `Section ${sectionId}`;

    const { themes, emos } = detectThemesAndEmotions(text);
    const characters = detectCharacters(text);
    const summary = `This section continues the ${currentParva} narrative arc and is included for complete story coverage across the Mahabharata.`;

    sectionCounter += 1;
    episodes.push({
      episode_id: `mbh.full.section_${String(sectionCounter).padStart(4, '0')}_${slugify(currentSection)}`,
      source_text: 'mahabharat',
      kanda_parva: `${currentParva}, ${currentSection}`,
      characters,
      location: 'Multiple locations across the Mahabharata narrative',
      summary_en: summary,
      source_excerpt: compactExcerpt(text),
      themes,
      emotional_situations: emos,
      linked_verses: [],
      source_ref: {
        title: 'Mahabharata, Ganguli complete prose (Archive mirror)',
        url: MAHABHARATA_URLS[0],
        locator: `${currentParva}, ${currentSection}`
      }
    });
  }
  return episodes;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  download(RAMAYANA_URL, TMP_RAMAYANA);
  download(MAHABHARATA_URLS, TMP_MAHABHARATA);

  const ramRaw = fs.readFileSync(TMP_RAMAYANA, 'utf8');
  const mbhRaw = fs.readFileSync(TMP_MAHABHARATA, 'utf8');

  const ramEpisodes = parseRamayanaEpisodes(ramRaw);
  const mbhEpisodes = parseMahabharataEpisodes(mbhRaw);

  const ramOut = path.join(outDir, 'ramayan-full.json');
  const mbhOut = path.join(outDir, 'mahabharat-full.json');

  fs.writeFileSync(ramOut, JSON.stringify(ramEpisodes, null, 2) + '\n', 'utf8');
  fs.writeFileSync(mbhOut, JSON.stringify(mbhEpisodes, null, 2) + '\n', 'utf8');

  console.log(`[Comprehensive] Ramayana episodes: ${ramEpisodes.length}`);
  console.log(`[Comprehensive] Mahabharata episodes: ${mbhEpisodes.length}`);
  console.log(`[Comprehensive] Wrote: ${ramOut}`);
  console.log(`[Comprehensive] Wrote: ${mbhOut}`);
}

main();
