# Mol* YAML Component Viewer

A static GitHub Pages application that loads one PDB structure and one YAML file, then creates named Mol* components from residue ranges, exact residue positions, or single residues.

## Rendering model

This version uses one lightweight context component plus the YAML region components:

- `Base structure` is created automatically as a white cartoon with opacity `0.2`;
- it selects the complete chain or chains from `default_chain`; when no default chain is set, it selects all protein chains;
- every enabled YAML region can create one named Mol* component above that context cartoon;
- every region component can have its own representation, color theme, opacity, and initial visibility;
- hydrogen display is forced to **Hide All** for the loaded scene and newly added representations;
- the custom YAML annotation sidebar remains removed;
- component management is done with the native Mol* controls.

The visual defaults under `viewer` still apply only to the YAML region components. Each region inherits those values and may override only the properties that need to differ.

## Features

- PDB + YAML loading from the repository or from local files
- inclusive `start`/`end` residue ranges
- exact residue lists such as `positions: [2, 10, 22]`
- single-residue selections with `residue: 42`
- author (`auth`) or sequential (`label`) residue numbering
- one chain, multiple chains, or all chains
- an automatic translucent white `Base structure` cartoon
- named Mol* region components
- hydrogen display disabled by default
- global visual defaults with per-region overrides
- native Mol* representations and color themes
- Mol* Illustrative-style defaults
- component opacity and initial visibility
- amino-acid sequence and Mol* control layouts
- PDB, YAML, and YAML-template downloads
- static deployment through GitHub Pages

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml
├── annotations/
│   ├── demo-regions.yaml
│   ├── template.yaml
│   └── README.md
├── pdb/
│   ├── demo-protein.pdb
│   └── README.md
├── .nojekyll
├── app.js
├── config.js
├── index.html
├── LICENSE
├── README.md
└── styles.css
```

## Quick start

1. Put the PDB file in `pdb/`.
2. Put the YAML file in `annotations/`.
3. Edit `config.js`.
4. Commit the files to the `main` branch.
5. In **Settings → Pages**, select **GitHub Actions**.

Example `config.js`:

```js
window.PROTEIN_REGION_VIEWER_CONFIG = {
  title: 'My protein components',
  subtitle: 'Functional regions rendered as independent Mol* components',

  autoLoad: true,
  pdbUrl: './pdb/my-protein.pdb',
  yamlUrl: './annotations/my-protein.yaml',

  // canvas | sequence | controls | sequence-controls | full
  defaultLayout: 'sequence-controls'
};
```

Set `autoLoad: false` to open an empty viewer and use only the local file selectors.

## Minimal YAML

```yaml
version: 1
title: My component scene
numbering: auth
default_chain: A

viewer:
  component_representation: cartoon
  component_color_theme: uniform
  component_color: "#CBD5E1"
  component_opacity: 1.0
  components_visible: true

regions:
  - name: N-terminal domain
    start: 1
    end: 90
    color: "#2563EB"

  - name: Active-site atoms
    positions: [102, 145, 177]
    component_representation: ball_and_stick
    component_color_theme: element-symbol
```

The first region inherits the global cartoon representation but overrides its color. The second region overrides both representation and color theme.

## Global defaults and region overrides

Properties inside `viewer` are defaults for all components:

```yaml
viewer:
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.45
  components_visible: true
```

A region may override any of them:

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

The effective value is selected in this order:

1. a property declared in the region;
2. the corresponding `viewer.component_*` default;
3. the built-in application default.

### `color` shorthand

This:

```yaml
- name: Blue domain
  start: 1
  end: 100
  color: "#2563EB"
```

is equivalent to:

```yaml
- name: Blue domain
  start: 1
  end: 100
  component_color_theme: uniform
  component_color: "#2563EB"
```

An explicit `component_color_theme` takes priority over `color`. For example, this uses native atom colors rather than yellow:

```yaml
- name: Active-site atoms
  positions: [25, 80, 121]
  color: "#FACC15"
  component_representation: ball_and_stick
  component_color_theme: element-symbol
```

## Base context and region components

The native Mol* component hierarchy starts with the automatic context component and then lists the YAML regions:

```text
Base structure
Region 1
Region 2
Region 3
```

`Base structure` is always:

```text
selection: complete default chain(s), or all protein chains when default_chain is omitted
representation: cartoon
color: white
opacity: 0.2
```

The base component is created first. YAML region components are then created as independent representations using their inherited or per-region settings. The base component does not consume or replace any of the existing `viewer.component_*` options.

### Overlapping selections

Independent Mol* components remain independent representations. If two YAML region selections overlap, both region representations are drawn for the shared residues. The translucent base cartoon is only a structural context layer.

## Mol* Illustrative style

Use:

```yaml
viewer:
  style: illustrative
```

When component properties are omitted, this supplies these defaults:

```text
representation: spacefill
color theme: illustrative
ignore light: enabled
outline: enabled
SSAO/occlusion: enabled
```

A complete example:

```yaml
viewer:
  style: illustrative
  component_representation: spacefill
  component_color_theme: illustrative
  component_opacity: 0.4
  components_visible: true
  background: "#FFFFFF"
```

A region can still override the Illustrative defaults:

```yaml
- name: Ligand-contact residues
  positions: [44, 79, 133]
  component_representation: ball_and_stick
  component_color_theme: element-symbol
  component_opacity: 1.0
```

`style: illustrative` controls the YAML region defaults and post-processing. The automatic `Base structure` remains a white cartoon at opacity `0.2`.

## Representations

Supported values for `component_representation`:

```text
cartoon
backbone
ball_and_stick
line
spacefill
carbohydrate
surface
putty
```

Example global default:

```yaml
viewer:
  component_representation: cartoon
```

Example per-region override:

```yaml
- name: Domain surface
  start: 50
  end: 180
  component_representation: surface
  component_opacity: 0.55
```

## Color themes

Useful values for `component_color_theme` include:

```text
uniform
default
element-symbol
chain-id
residue-name
secondary-structure
sequence-id
hydrophobicity
molecule-type
illustrative
uncertainty
occupancy
formal-charge
```

Aliases `atom`, `element`, and `cpk` are normalized to `element-symbol`.

### Atom/CPK colors

```yaml
- name: Active-site atoms
  positions: [42, 77, 105]
  component_representation: ball_and_stick
  component_color_theme: element-symbol
```

### Fixed component color

```yaml
- name: Catalytic domain
  start: 80
  end: 160
  component_color_theme: uniform
  component_color: "#7C3AED"
```

### Hydrophobicity surface

```yaml
- name: Hydrophobic surface
  start: 120
  end: 250
  component_representation: surface
  component_color_theme: hydrophobicity
  component_opacity: 0.7
```

## Opacity

Global component opacity:

```yaml
viewer:
  component_opacity: 0.4
```

Per-region override:

```yaml
- name: Opaque active site
  positions: [45, 88, 132]
  component_opacity: 1.0
```

Values range from `0` to `1`:

```text
0.00 = fully transparent
0.25 = 25% opaque
0.50 = 50% opaque
1.00 = fully opaque
```

The automatic `Base structure` opacity is fixed at `0.2`. `component_opacity` continues to control only the YAML region components.

## Hydrogen display

Hydrogens are hidden automatically. The application sets the Mol* component-manager option to `Hide All` and also marks atomistic YAML representations to ignore hydrogens. No YAML property is required.

This applies to region representations such as `ball_and_stick`, `line`, `spacefill`, and `surface`, including representations added later through the native Mol* controls.

## Initial visibility

Show all generated representations initially:

```yaml
viewer:
  components_visible: true
```

Hide one component initially:

```yaml
- name: Optional surface
  start: 200
  end: 300
  component_visible: false
```

A hidden representation is still present in the Mol* component hierarchy and can be enabled with the eye control.

## Region selection forms

Each region uses exactly one selection form.

### Inclusive range

```yaml
- name: Domain
  start: 10
  end: 80
```

Residues 10 and 80 are included.

### Exact positions

```yaml
- name: Catalytic residues
  positions: [2, 10, 22]
```

All positions become one named component.

### One residue

```yaml
- name: Catalytic lysine
  residue: 42
```

Do not combine `positions` with `start`/`end` in the same region.

## Chains

A default chain for all regions:

```yaml
default_chain: A
```

One region on another chain:

```yaml
- name: Chain B domain
  chain: B
  start: 10
  end: 80
```

Multiple chains:

```yaml
- name: Conserved residues
  chains: [A, B, C]
  positions: [42, 77, 105]
```

All chains:

```yaml
- name: Shared motif
  chain: all
  positions: [12, 25, 38]
```

You may also omit `default_chain`, `chain`, and `chains`.

## Residue numbering

Author/PDB numbering:

```yaml
numbering: auth
```

Sequential polymer numbering:

```yaml
numbering: label
```

Per-region override:

```yaml
- name: Sequential segment
  numbering: label
  start: 1
  end: 50
```

## Other region properties

```yaml
- name: RNase H insertion
  start: 120
  end: 185

  enabled: true
  create_component: true
  component_name: RNase H insertion
  component_visible: true

  tooltip: true
  label: false
  description: Conserved insertion in this protein family.
```

`create_component: false` suppresses that region's visual representation. A tooltip or 3D label may still require a selector component internally, but it does not add a visual representation.

## Advanced representation and theme parameters

Global representation parameters:

```yaml
viewer:
  component_representation_params:
    ignoreLight: true
```

Per-region parameters are merged over the global mapping:

```yaml
- name: Detailed surface
  start: 50
  end: 150
  component_representation: surface
  component_representation_params:
    quality: high
```

Color-theme parameters:

```yaml
viewer:
  component_color_theme: chain-id
  component_color_theme_params:
    asymId: auth
```

These mappings are passed to the corresponding Mol* theme or representation and therefore depend on that theme's own parameter schema.

## Mol* layouts

The page offers:

| Value | Interface |
|---|---|
| `canvas` | 3D structure only |
| `sequence` | Sequence + 3D |
| `controls` | Mol* controls + 3D |
| `sequence-controls` | Sequence + controls + 3D |
| `full` | Full Mol* interface |

For component management, use `controls`, `sequence-controls`, or `full`.

Set the initial layout in `config.js`:

```js
defaultLayout: 'sequence-controls'
```

## Local files and privacy

Local PDB and YAML files are read inside the browser tab. The application does not upload them to an application server.

Use either:

- **Choose PDB** and **Choose YAML**; or
- drag one `.pdb` and one `.yaml`/`.yml` file onto the viewer.

## Downloads

After loading a pair, the footer enables:

```text
Download PDB
Download YAML
YAML template
```

The PDB and YAML downloads preserve the original loaded text.

## GitHub Pages deployment

The repository contains:

```text
.github/workflows/pages.yml
```

To publish:

1. Push the project files to the repository root.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the source.
4. Run the workflow or push to `main`.

For a project repository, the address normally follows this pattern:

```text
https://USERNAME.github.io/REPOSITORY/
```

## Updating an existing installation

For the base-context update, replace:

```text
app.js
index.html
README.md
UPDATE.md
```

No CSS, `config.js`, PDB, or YAML change is required. Keep your own:

```text
styles.css
config.js
pdb/
annotations/your-file.yaml
.github/
```

The white `Base structure` cartoon and the `Hide All` hydrogen option are applied automatically. Existing `viewer.component_*` and region-level settings continue to control the YAML region components exactly as before.

## Safari cache

The local asset URLs use `?v=7`. After publication, Safari should request the updated files.

When an older version still appears:

1. Enable Safari's web developer features.
2. Use **Develop → Empty Caches**.
3. Press `Command + R`.

## Browser console API

The page exposes:

```js
ProteinRegionViewer.getState()
ProteinRegionViewer.loadConfigured()
ProteinRegionViewer.loadSelectedFiles()
ProteinRegionViewer.reload()
ProteinRegionViewer.setLayout('full')
```

`getState()` reports the effective global component defaults and the resolved properties of every YAML region.

## Troubleshooting

### The viewer is empty

Confirm that:

- at least one region is enabled;
- at least one region matches residues in the PDB;
- `create_component` is not false for every matching region;
- the component is not hidden by `component_visible: false`;
- the chain and numbering mode match the PDB.

### A region color is ignored

An explicit native theme takes priority over `color`:

```yaml
component_color_theme: element-symbol
```

Remove that property or use `component_color_theme: uniform` when a fixed color is required.

### Two components are drawn on top of one another

Their residue selections overlap. This is expected for independent Mol* representations. Make the selections disjoint when no layered geometry is desired.

### The sequence is missing

Choose `sequence`, `sequence-controls`, or `full` in the layout selector.

### The components are difficult to manage

Choose `controls`, `sequence-controls`, or `full`, then use the native Mol* eye, focus, and representation controls.

## Included demo

The included PDB is a synthetic 60-residue structure for interface testing only. It is not intended for scientific analysis.

## Versions

```text
Mol* Viewer: 5.11.0
js-yaml: 5.4.1
Application: 2.0.0
```
