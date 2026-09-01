# YAML annotations

YAML files in this directory define the Mol* components rendered for a PDB structure. The format is designed to be readable, version-controlled, and easy to reuse across related proteins.

## Minimal file

```yaml
version: 1
title: My component scene
numbering: auth
default_chain: A

viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
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

The application also creates a white `Base structure` cartoon at opacity `0.2` for whole-chain context. Viewer component defaults apply to the YAML regions, not to that base component.

## Selection forms

Use exactly one selection form per region.

### Inclusive range

```yaml
- name: Domain
  start: 10
  end: 80
```

### Exact positions

```yaml
- name: Catalytic residues
  positions: [2, 10, 22]
```

### Single residue

```yaml
- name: Catalytic lysine
  residue: 42
```

## Chains and numbering

Global defaults:

```yaml
numbering: auth
default_chain: A
```

Per-region overrides:

```yaml
- name: Chain B motif
  chain: B
  numbering: label
  positions: [12, 19, 44]
```

Multiple or all chains:

```yaml
chains: [A, B, C]
```

```yaml
chain: all
```

## Viewer defaults

```yaml
viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
  components_visible: true
  background: "#FFFFFF"
  create_components: true
  show_labels: false
  show_tooltips: true
```

A region inherits these values and may override any `component_*` property.

## Region styling

Uniform color shorthand:

```yaml
- name: Blue domain
  start: 1
  end: 100
  color: "#2563EB"
```

Explicit component styling:

```yaml
- name: Catalytic surface
  start: 120
  end: 220
  component_representation: surface
  component_color_theme: uniform
  component_color: "#F97316"
  component_opacity: 0.65
  component_visible: true
```

Native element colors:

```yaml
- name: Active-site atoms
  positions: [44, 79, 133]
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
```

## Common region properties

| Property | Purpose |
|---|---|
| `name` | Region and component name |
| `enabled` | Include or exclude the region |
| `start`, `end` | Inclusive range |
| `positions` | Exact residue list |
| `residue` | Single residue |
| `chain`, `chains` | Chain selection override |
| `numbering` | `auth` or `label` |
| `color` | Uniform color shorthand |
| `create_component` | Create the region representation |
| `component_name` | Custom Mol* component name |
| `component_representation` | Geometry type |
| `component_color_theme` | Mol* color theme |
| `component_color` | Fixed color |
| `component_opacity` | Opacity from `0` to `1` |
| `component_visible` | Initial visibility |
| `tooltip` | Mol* hover tooltip |
| `label` | 3D label |
| `description` | Tooltip description |

## Notes

- Hydrogens are hidden automatically.
- `style: illustrative` enables Illustrative defaults and post-processing.
- Explicit region properties take priority over viewer defaults.
- Overlapping regions remain independent Mol* representations and may draw geometry over the same residues.
- File names and paths are case-sensitive on GitHub Pages.
- Start from [`template.yaml`](template.yaml) for a documented example.
