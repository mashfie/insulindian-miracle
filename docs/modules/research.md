---
tags: [module, python, research]
type: module
related:
  - "[[cli]]"
  - "[[resource-curse]]"
  - "[[multi-armed-bandits]]"
---

# research.py

`src/insulindian_miracle/research.py` — 113 lines. Academic paper index management and theory synthesis.

## Key Exports

| Export | Purpose |
|--------|---------|
| `fetch_papers(manifest, cache_dir)` | Download papers listed in `research/index.json` |
| `synthesize_theory(manifest, output)` | Generate theory synthesis from paper metadata |

## Research Manifest

`research/index.json` contains ~20 academic paper entries with metadata (title, authors, year, URL, tags). Papers span:

- Multi-armed bandit theory (Lattimore & Szepesvári, Russo et al.)
- Resource curse economics (Sachs & Warner, Ross)
- Institutional economics (Acemoglu & Robinson)
- Urban economics (Krugman, Henderson)
- Restless bandits (Akbarzadeh et al., Whittle)

## Supporting Files

- `research/reading-order.md` — curated reading order (first pass, second pass, deferred)
- `research/theory/corpus-synthesis.md` — synthesised theory document
- `research/theory/peninsula-framework.md` — model-specific theoretical framework
