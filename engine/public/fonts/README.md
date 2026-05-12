# Fonts

Place `Nayana-Regular.otf` here. Build it from the parent project's font
pipeline:

```
cd ../              # parent nayana/ directory
make build
cp fonts/output/Nayana-Regular.otf engine/public/fonts/
```

If the font is missing, the harness still works — text just renders in
the browser's fallback sans-serif without vowel markers.
