# Insulindian Miracle: Frontend Dashboard & Archive

This repository component houses the **Insulindian Miracle Archive**, an interactive web exhibition designed to render, synthesize, and interrogate the results of our computational multi-armed bandit (MAB) simulations. 

## Academic Context

The simulation explores institutional drift, city formation, and the resource curse across procedurally generated peninsulas. It models candidate settlement sites as arms in a Restless Multi-Armed Bandit (RMAB).

This frontend was built to render the output of the **1,000,008-run high-performance Pure Rust sweep**. The scale of this data (over 1 million traces) provides robust empirical validation of our six canonical hypotheses, highlighting phenomena such as the **UCB-Bait Trap**, the mathematical emergence of **Zipf's Law primacy**, and the persistence of the **Resource Curse**.

## Architecture & Technology

- **Framework:** Next.js 16 / React 19 (App Router)
- **Styling:** Vanilla CSS 
- **Content:** The data layer is driven by statically generated JSON artifacts (`content/generated/exemplars.json`) and rigorous Markdown documentation (`content/source/docs/`).
- **Rendering:** Uses custom MDX components and `rehype`/`remark` pipelines for academic-grade mathematics (KaTeX) and prose formatting.

## Running the Archive

To run the local server and explore the latest 1-million run synthesis data:

```bash
pnpm install
pnpm dev
```

The archive is available at `http://localhost:3000`.

## Documentation

The primary findings and policy dossiers are accessible within the application's routing structure:
- `/` - The Archive (Landing Page & Synthesized Results)
- `/atlas/` - Cartographic Ledgers and Terrain Generation
- `/scenarios/` - Economic Scenario Outlines (e.g., Resource Curse, Megacity Trap)
- `/policies/` - Algorithm Formulations (e.g., Whittle Index, Thompson Sampling)
- `/references/` - Academic Bibliography

*The writing and presentation within this dashboard enforce a strict, structurally analytical tone, avoiding generic visualization tropes in favor of restrained, rigorous exposition.*
