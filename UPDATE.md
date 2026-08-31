# Update: named Mol* components for YAML regions

This update keeps the existing colored base representation and also creates one independently named Mol* component for every enabled YAML region.

## Updating an existing deployment

Replace these files in the repository root:

```text
app.js
index.html
styles.css
README.md
```

Optionally replace the documentation/examples in:

```text
annotations/template.yaml
annotations/demo-regions.yaml
annotations/README.md
```

Keep your existing files unchanged unless you intend to edit them:

```text
config.js
pdb/
annotations/your-own-files.yaml
.github/
```

The old YAML format remains valid. Component generation defaults to enabled, with component representations hidden initially.

## Recommended YAML settings

Add this under `viewer:`:

```yaml
viewer:
  representation: cartoon
  base_color: "#CBD5E1"

  create_components: true
  component_representation: cartoon
  components_visible: false
  base_component_name: Base structure
```

Per-region overrides are optional:

```yaml
regions:
  - name: Active site
    start: 42
    end: 58
    color: "#DC2626"
    create_component: true
    component_representation: ball_and_stick
    component_visible: false
```

## Using the components

1. Open the site with `defaultLayout: 'sequence-controls'`, `controls`, or `full`.
2. Open the structure/component section in the right-side Mol* controls.
3. The hierarchy contains `Base structure` and the region names from YAML.
4. Use the eye control beside a region representation to show it.
5. Hide `Base structure` to isolate that region.
6. Use the standard Mol* component controls to focus or restyle it.

## Safari cache

`index.html` uses `?v=2` for the local CSS and JavaScript files. After committing the update, wait for GitHub Actions to finish and reload the page. If Safari still shows the old version, use **Develop → Empty Caches**, then reload with `Command + R`.
