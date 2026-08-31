# YAML component files

Each enabled entry in `regions` becomes a named Mol* component. The application renders **only those component representations**; it does not create a full-protein `Base structure` representation and it does not add a second coloring layer.

The `viewer.component_*` properties define global defaults. A region inherits those defaults unless it provides an override.

## Minimal example

```yaml
version: 1
title: My components
numbering: auth
default_chain: A

viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.5
  components_visible: true

regions:
  - name: Domain A
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active-site atoms
    positions: [120, 155, 188]
    component_representation: ball_and_stick
    component_color_theme: element-symbol
    component_opacity: 1.0
```

`color` is a convenience shorthand for a uniform component color. An explicit `component_color_theme` takes priority.

Avoid overlapping selections when you do not want duplicated geometry: separate Mol* components are independent representations, so overlapping component selections are intentionally rendered on top of one another.
