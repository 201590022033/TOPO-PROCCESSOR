# Target OcuView3D Architecture (Not Implemented)

```text
instrument adapters
        |
        v
normalized clinical data
        |
        v
patient eye model / optical engine
        |
        +--> numerical analysis
        +--> ray tracing
        |
        v
viewer adapters
        |
        +--> Blender research viewer
        +--> future Python GUI
```

The completed topography application should initially be one instrument adapter/processing subsystem. Blender remains a research and validation viewer, not a dependency of the clinical engine. Patient measurements, reference/Gullstrand parameters, rendered artifacts, and clinical numeric data must remain separate and traceable.

