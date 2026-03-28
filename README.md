# pi-fireworks-provider

Fireworks AI provider extension for [pi](https://github.com/mariozechner/pi).

Models are fetched from [models.dev](https://models.dev) on startup, with a hardcoded fallback list if the fetch fails.

## Install

```bash
pi install pi-fireworks-provider
```

Or add to your pi config:

```json
{
  "packages": ["pi-fireworks-provider"]
}
```

## Auth

Use `/login` in pi and select **Fireworks AI** to paste your API key.

You can also set the `FIREWORKS_API_KEY` environment variable.

## License

MIT
