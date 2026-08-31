# YAML annotations

This directory contains the YAML file that describes residue selections and their final colors in the Mol* viewer.

## Single-visual model

The default configuration uses one visible Mol* representation:

```yaml
viewer:
  style: illustrative
  create_components: true
  component_visuals: false
```

`style` defines the global appearance. Every enabled region then replaces the final color for its selected residues. Later entries win where selections overlap.

`create_components: true` still creates named Mol* selector components for focus, tooltips, selection, and manual editing. `component_visuals: false` prevents those components from receiving extra representations, so the same atoms are not drawn twice.

## Selection examples

Inclusive range:

```yaml
- name: Domain
  start: 10
  end: 90
  color: "#2563EB"
```

Exact positions:

```yaml
- name: Catalytic residues
  positions: [12, 45, 88]
  color: "#FACC15"
```

One residue:

```yaml
- name: Catalytic lysine
  residue: 42
  color: "#DC2626"
```

## Overlap precedence

```yaml
regions:
  - name: Whole domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active site
    positions: [12, 45, 88]
    color: "#FACC15"
```

The domain is blue, except residues 12, 45, and 88, which are yellow because the active-site entry is later.

## Optional independent visual

This is deliberately opt-in because it adds a second representation over the base view:

```yaml
- name: Active-site atoms
  positions: [12, 45, 88]
  color: "#FACC15"
  component_visual: true
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_visible: true
```

Omit `component_visual` to remain in strict single-visual mode.
