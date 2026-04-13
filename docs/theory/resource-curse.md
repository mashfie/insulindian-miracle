---
tags: [theory, resource-curse]
type: theory
related:
  - "[[resource-curse-scenario]]"
  - "[[botswana]]"
  - "[[institutional-dynamics]]"
---

# Resource Curse

The resource-curse claim is not "resources are bad." The stronger academic statement is that resource abundance is conditional on institutions.

## Core literature

- [Sachs and Warner (1995)](https://www.nber.org/papers/w5398): resource-export intensity predicts slower growth in a broad cross-country reduced form.
- [Ross (2001)](https://doi.org/10.1353/wp.2001.0011): rentier-state and political channels.
- [Mehlum, Moene, and Torvik (2006)](https://academic.oup.com/ej/article/116/508/1/5089390): resources are harmful under grabber-friendly institutions and beneficial under producer-friendly ones.

## Mapping to the simulator

The simulator operationalizes the curse through:

- high immediate resource reward,
- upward extraction drift when reform does not occur,
- reduced long-run productive performance under high extraction,
- optional active-use depletion of the same site.

The key reduced-form law is

$$
e_i' = e_i + \kappa_{\text{curse}} \rho_i \cdot \text{buffered pressure} \cdot (1-e_i).
$$

## What the simulation is and is not

It **is** a stylized institutional-drift model with resource rents.

It is **not**:

- a sectoral Dutch-disease model,
- a state-capacity model,
- an identified macro growth regression.

That distinction should be kept explicit whenever scenario notes use country analogies.
