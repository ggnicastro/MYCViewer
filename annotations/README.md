# YAML annotations

Place hosted `.yaml` or `.yml` annotation files in this directory and reference them from `config.js`:

```js
yamlUrl: './annotations/my-protein-regions.yaml'
```

Start from `template.yaml`. Every enabled region requires `name` and `color`, plus exactly one residue-selection form.

## Base structure settings

The complete protein or structure is represented by the named Mol* component **Base structure**. Its style and opacity are configured inside `viewer`.

### Base opacity

```yaml
viewer:
  base_opacity: 0.35
```

`base_opacity` accepts a number from `0` to `1`:

```text
0.0 = fully transparent
0.35 = 35% opaque
1.0 = fully opaque
```

This property controls the complete base representation, including the region colors painted on it. It does not control the independent region components.

Use `component_opacity` globally, or a per-region `component_opacity`, for those independent components:

```yaml
viewer:
  base_opacity: 0.25
  component_opacity: 1.0

regions:
  - name: Active site
    positions: [42, 77, 105]
    color: "#FACC15"
    component_representation: ball_and_stick
    component_color_theme: element-symbol
    component_opacity: 1.0
    component_visible: true
```

### Illustrative style

Use the project-level style switch to start with the main ingredients of Mol*'s Illustrative quick style:

```yaml
viewer:
  style: illustrative
```

When no explicit overrides are present, the base view uses:

- a `spacefill` representation;
- the native `illustrative` color theme;
- ignore-light rendering;
- outline postprocessing;
- SSAO/occlusion postprocessing.

A compact setup is:

```yaml
viewer:
  style: illustrative
  selector: protein
  base_opacity: 0.35
  background: "#FFFFFF"
```

An explicit representation overrides the Illustrative default. For example, this keeps the illustrative color and rendering treatment but uses cartoon geometry:

```yaml
viewer:
  style: illustrative
  representation: cartoon
  selector: protein
  base_opacity: 0.45
```

Advanced overrides are available:

```yaml
viewer:
  style: illustrative

  base_color_theme: illustrative
  base_color_theme_params:
    style:
      name: chain-id
      params:
        asymId: auth
        overrideWater: true

  base_representation_params:
    ignoreLight: true

  postprocessing:
    enable_outline: true
    enable_ssao: true
```

`component_color_theme: illustrative` affects only one independent region component. Use `viewer.style: illustrative` when the complete base structure should receive the Illustrative preset behavior.

## Residue-selection forms

### Inclusive range

```yaml
- name: Catalytic domain
  start: 80
  end: 160
  color: "#2563EB"
```

Both endpoints are included.

### Exact positions

```yaml
- name: Active-site residues
  positions: [2, 10, 22]
  color: "#FACC15"
```

Only residues 2, 10, and 22 are selected. They are colored together and become one named Mol* component. Duplicate values are removed and the list is sorted internally.

### One residue

```yaml
- name: Catalytic lysine
  residue: 42
  color: "#DC2626"
```

Different entries in the same YAML file may use different forms. For clarity, one entry must not mix `positions` with `start`/`end`.

Accepted aliases for `positions` are `residues`, `residue_positions`, and `position_list`, including camelCase forms where applicable.

## Chains and numbering

Exact lists follow the same `numbering`, `chain`, and `chains` rules as ranges:

```yaml
numbering: auth
default_chain: A

regions:
  - name: Chain A motif
    positions: [12, 19, 44]
    color: "#DC2626"

  - name: Shared motif
    chains: [A, B]
    numbering: label
    positions: [5, 8, 13]
    color: "#8B5CF6"
```

For multiple chains, the same position list is applied independently to every listed chain. Use separate region entries when each chain needs a different list.

## Colored base view and named components

By default, each enabled region is colored on the complete base representation **and** created as a named Mol* component. Exact positions in one entry remain one component, even when the residues are not contiguous.

```yaml
viewer:
  base_opacity: 0.35
  create_components: true
  component_representation: cartoon
  component_color_theme: uniform
  component_opacity: 1.0
  components_visible: false
  base_component_name: Base structure
```

Open a layout containing **Controls**, use the eye icon to show a region component, and hide **Base structure** to isolate it.

## Native Mol* color themes

For exact active-site residues rendered as atom-colored ball-and-stick:

```yaml
- name: Active site
  positions: [40, 43, 67, 91]
  color: "#FACC15"
  create_component: true
  component_name: Active-site atoms
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
  component_visible: true
```

`color` controls the base representation and legend swatch. `component_color_theme: element-symbol` gives the independent component Mol*'s native element/CPK atom colors.

Useful themes include:

```text
uniform
default
element-symbol
chain-id
residue-name
secondary-structure
sequence-id
hydrophobicity
illustrative
uncertainty
```

The aliases `atom`, `element`, and `cpk` resolve to `element-symbol`.

## Limits and validation

The application accepts up to:

- 1,000 region entries;
- 5,000 exact positions in one region;
- 25,000 generated selector expressions after chain expansion and consecutive-position compression;
- 250 generated component nodes.

Exact-position selections receive per-position coverage validation. The legend shows `PARTIAL` when some requested residues are present and others are missing, and `NO MATCH` when none are found.

See the project root `README.md` for all YAML properties, style overrides, component options, layouts, hosted/local loading, and troubleshooting.
