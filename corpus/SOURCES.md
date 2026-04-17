# Corpus Sources and Coverage

This corpus update is source-grounded and metadata-first for retrieval quality.

## Primary Sources

- Griffith's Valmiki Ramayana (complete, public domain)
  - https://www.gutenberg.org/ebooks/24869
- Ganguli's Mahabharata (complete, preferred)
  - https://www.sacred-texts.com/hin/maha/
- Harivamsha (Krishna life), Manmatha Nath Dutt (1897)
  - https://archive.org/details/a-prose-english-translation-of-harivamsha
  - Full text stream: https://archive.org/stream/a-prose-english-translation-of-harivamsha/A%20Prose%20English%20Translation%20of%20Harivamsha_djvu.txt

## Verse Packs Included

- Bhagavad Gita key verses for Krishna-Arjuna style turns
- Hanuman Chalisa seed verses for Hanuman persona and devotional turns
- Key shloka set (e.g., Yato Dharmas Tato Jayah, Ramo Vigrahavan Dharmah)

## Curation Strategy Implemented

- Embedded content uses summaries + themes + emotional situations, not raw full text
- Anchor episodes are explicitly flagged with is_anchor_episode: true
- Source provenance is captured using source_ref { title, url, locator }

## Files Added

- corpus/episodes/mahabharat/ganguli-anchor-episodes.json
- corpus/episodes/ramayan/griffith-anchor-episodes.json
- corpus/episodes/harivamsha/dutt-anchor-episodes.json
- corpus/verses/core-verse-pack.json

## Build Command

- npm run corpus:build

This command compiles all source packs into runtime files:

- corpus/placeholder/episodes.json
- corpus/placeholder/verses.json
