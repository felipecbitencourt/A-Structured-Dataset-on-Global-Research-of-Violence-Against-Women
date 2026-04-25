# Analytical Interface package

This folder stores the static analytical interface package prepared for release.

## Structure

- `dataset/` - three canonical CSV files.
- `docs/` - package documentation and generated metadata (`meta.json`).
- `code/` - export/build support scripts (for example `export_static_data.py`).
- `frontend/` - static web interface and exported JSON files in `frontend/data/`.

## Build from repository clone

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File analytical_interface\build.ps1
```

After the build, the `analytical_interface/` directory is ready for packaging/distribution.
