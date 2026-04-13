---
tags: [module, terrain]
type: module
related:
  - "[[terrain-generation]]"
  - "[[urban-economics]]"
---

# Terrain

`rust/src/terrain.rs` handles:

- gradient-noise terrain generation,
- land/coast/river masks,
- derived spatial feature layers,
- candidate-site selection with spacing constraints.

It is the spatial prior of the whole project.
