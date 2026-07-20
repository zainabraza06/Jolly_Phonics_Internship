# app_integration

The trained model artifacts consumed by the backend. **Data only** — no
runtime code lives here.

```
model_export/
  model.pth             trained fusion weights (state_dict, ~54 MB)
  model_config.json     feature geometry the weights assume
  label_map.json        class id <-> training label
  reference_stats.pkl   elder + child reference vectors for scoring
  hf_cache/             cached Whisper-small download
  mp_models/            MediaPipe .task assets (created on first run)
```

## How it's loaded

`backend/phonics` reads this directory. The path defaults to
`<repo>/app_integration/model_export` and can be overridden:

```bash
export PHONICS_MODEL_DIR=/path/to/model_export
```

`phonics/config.py` validates `model_config.json` against the constants the
feature extractor actually uses and raises on mismatch. A checkpoint paired
with the wrong feature geometry produces confident nonsense rather than an
error, so that check is deliberately fatal.

## Regenerating

Run `colab/evaluate_and_export.py` in Colab. It refreshes `model.pth`,
`label_map.json`, `model_config.json` and `reference_stats.pkl`, and writes
the expert-evaluation spreadsheet.

Earlier versions of the exporter also emitted a self-contained
`inference.py` here, generated from a string literal that duplicated the
model and feature code. That runtime now lives once in `backend/phonics/`,
so the exporter no longer writes it. The last generated copy is preserved
at `_backup_pre_refactor/inference_exported.py` for reference.

## Reference groups

`reference_stats.pkl` holds two groups:

- `child` — learner reference recordings; the default for scoring
- `elder` — adult demonstrator recordings

Select with `PHONICS_REFERENCE_GROUP`. Classes missing a reference score as
`None` rather than zero, so the UI can distinguish "not measurable" from
"measured badly".
