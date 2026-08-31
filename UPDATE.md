# Update: base opacity and Mol* Illustrative style

This update adds independent opacity control for the complete **Base structure** representation and a YAML switch for the main ingredients of Mol*'s built-in Illustrative quick style.

Existing YAML files that use ranges, exact positions, named components, and native component color themes remain compatible.

## Base structure opacity

Add `base_opacity` inside `viewer`:

```yaml
viewer:
  base_opacity: 0.35
```

Accepted values are from `0` to `1`:

```text
0.0 = fully transparent
0.35 = 35% opaque
1.0 = fully opaque
```

This property changes the complete named **Base structure** representation, including the YAML region colors applied to it.

It is separate from component opacity:

```yaml
viewer:
  base_opacity: 0.25
  component_opacity: 1.0
```

A per-region `component_opacity` continues to override only that independent region representation.

## Illustrative style

Use:

```yaml
viewer:
  style: illustrative
```

Without explicit overrides, this selects:

- `spacefill` for the base representation;
- Mol*'s native `illustrative` color theme;
- entity-based illustrative coloring with water override;
- `ignoreLight: true`;
- outline postprocessing;
- SSAO/occlusion postprocessing.

A complete example:

```yaml
version: 1
title: My protein regions
numbering: auth
default_chain: A

viewer:
  style: illustrative
  selector: protein
  base_opacity: 0.35
  background: "#FFFFFF"

  create_components: true
  component_representation: cartoon
  component_color_theme: uniform
  component_opacity: 1.0
  components_visible: false
  base_component_name: Base structure

regions:
  - name: Domain
    start: 1
    end: 100
    color: "#2563EB"

  - name: Active-site atoms
    positions: [42, 77, 105]
    color: "#FACC15"
    component_representation: ball_and_stick
    component_color_theme: element-symbol
    component_visible: true
```

## Representation override

The Illustrative style defaults to `spacefill` only when `representation` is omitted.

This reproduces the standard geometry:

```yaml
viewer:
  style: illustrative
```

This deliberately uses cartoon geometry instead:

```yaml
viewer:
  style: illustrative
  representation: cartoon
```

## Advanced overrides

The style defaults can be extended or overridden:

```yaml
viewer:
  style: illustrative
  representation: spacefill
  base_color_theme: illustrative
  base_opacity: 0.35

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

New canonical properties:

```text
viewer.style
viewer.base_opacity
viewer.base_color_theme
viewer.base_color_theme_params
viewer.base_representation_params
viewer.postprocessing
```

Accepted style aliases include `quick_style`, `preset`, and `base_style`. `base_component_opacity` is accepted as an alias for `base_opacity`.

## Updating an existing deployment

Replace these files in the repository root:

```text
app.js
index.html
styles.css
README.md
UPDATE.md
```

Optionally replace the updated examples and annotation documentation:

```text
annotations/template.yaml
annotations/demo-regions.yaml
annotations/README.md
```

Keep project-specific files such as:

```text
config.js
pdb/
annotations/your-own-files.yaml
.github/
```

Your old YAML remains valid. Add the new properties only where you want the new behavior.

## Safari cache

The updated `index.html` uses `?v=5` for local files. After GitHub Actions completes, reload the page. If Safari still shows the previous version, use **Develop → Empty Caches**, then press `Command + R`.
