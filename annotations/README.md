# YAML annotations

Place hosted `.yaml` or `.yml` annotation files in this directory and reference them from `config.js`:

```js
yamlUrl: './annotations/my-protein-regions.yaml'
```

Start from `template.yaml`. Each region requires `name`, `start`, `end`, and `color`; the region list may contain any practical number of entries.

See the project root `README.md` for chain selection, `auth` versus `label` numbering, overlaps, layouts, and validation behavior.
