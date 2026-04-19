# Insulindian Miracle: Frontend Dashboard & Archive

This repository component houses the **Insulindian Miracle Archive**, an interactive web exhibition designed to render, synthesize, and interrogate the results of our computational multi-armed bandit (MAB) simulations. 

## Academic Context

The simulation explores institutional drift, city formation, and the resource curse across procedurally generated peninsulas. It models candidate settlement sites as arms in a Restless Multi-Armed Bandit (RMAB).

This frontend now renders a **stratified 1,590,008-execution evidence program** rather than one undifferentiated million-run story:

- `legacy_1m`: 1,000,008 non-oracle policy executions from the legacy baseline sweep.
- `historical_90k`: 90,000 scenario-resolved executions across 9 canonical scenarios.
- `stress_500k`: 500,000 stress executions with perturbed initial conditions and trap-heavy scenario weights.

The distinction matters. The million-run cohort supports broad baseline ranking; the historical and stress cohorts support scenario-level and oracle-gap claims.

## Architecture & Technology

- **Framework:** Next.js 16 / React 19 (App Router)
- **Styling:** Vanilla CSS 
- **Content:** The data layer is driven by statically generated JSON artifacts (`content/generated/exemplars.json`) and rigorous Markdown documentation (`content/source/docs/`).
- **Rendering:** Uses custom MDX components and `rehype`/`remark` pipelines for academic-grade mathematics (KaTeX) and prose formatting.

## Running the Archive

To run the local server and explore the latest cohort synthesis data:

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
