# YAML annotations

Place hosted `.yaml` or `.yml` annotation files in this directory and reference them from `config.js`:

```js
yamlUrl: './annotations/my-protein-regions.yaml'
```

Start from `template.yaml`. Each region requires `name`, `start`, `end`, and `color`.

## Colored base view and named components

By default, each enabled region is colored on the compact base representation **and** created as a named Mol* component. The independent region representations start hidden to avoid drawing duplicate geometry. Open a layout containing **Controls**, use the eye icon to show a region component, and hide **Base structure** to isolate it.

Global component settings:

```yaml
viewer:
  create_components: true
  component_representation: cartoon
  component_opacity: 1.0
  components_visible: false
  base_component_name: Base structure
```

Optional per-region overrides:

```yaml
- name: Active site
  start: 40
  end: 55
  color: "#DC2626"
  create_component: true
  component_name: Active-site atoms
  component_representation: ball_and_stick
  component_opacity: 0.9
  component_visible: false
```

`component_name` defaults to `name`. `component_opacity` accepts values from `0` to `1`. Set `create_component: false` to keep a region colored on the base view without creating an independent visual representation.

The application accepts up to 1,000 region entries and up to 250 generated component nodes as defensive browser-safety limits.

See the project root `README.md` for chain selection, `auth` versus `label` numbering, overlapping ranges, component controls, layouts, and validation behavior.
