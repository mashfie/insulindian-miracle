---
tags: [theory, urban-economics]
type: theory
related:
  - "[[terrain-generation]]"
  - "[[reward-function]]"
  - "[[balanced-urban]]"
  - "[[megacity-trap]]"
---

# Urban Economics

The urban side of the project combines agglomeration, congestion, and settlement hierarchy in stylized form.

## Literature spine

- [Krugman (1991)](https://www.nber.org/papers/w3275)
- [Duranton and Puga (2004)](https://www.sciencedirect.com/science/article/pii/S1574008004800051)
- [Henderson (1974)](https://ideas.repec.org/a/aea/aecrev/v64y1974i4p640-56.html)
- [Gabaix (1999)](https://academic.oup.com/qje/article/114/3/739/1848099)
- [Christaller (1933/1966)](https://openlibrary.org/books/OL20675263M/Central_places_in_Southern_Germany)

## Mapping to the code

- agglomeration enters as `(1-e_i) p_i^alpha`,
- congestion enters quadratically,
- extreme primacy is penalized by the metropolitan overstretch term,
- a Gaussian-style secondary-city term rewards midsize systems,
- network benefits are openness-mediated and distance-weighted.

## Caution

This is not a full urban general-equilibrium model. There are no wages, commuting costs, rents, or endogenous transport prices. The simulator is a spatial political-economy analogue, not a literal city-system calibration.
