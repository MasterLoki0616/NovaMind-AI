# Deploy NovaMind AI

NovaMind AI can now run as a single Node service that serves both:

- the marketing website
- the `/api/*` backend used by chat, screen, file, and voice tools

## Fastest path

1. Push the repo to GitHub.
2. Create a new Web Service on Render.
3. Connect this repository.
4. Render will detect [`render.yaml`](./render.yaml).
5. Add the `OPENAI_API_KEY` environment variable in Render.
6. Deploy.

After the first deploy, Render gives you a live `onrender.com` domain. You can open that URL from other devices immediately.

## GitHub Pages option

If you only want the public marketing website online, this repo now also includes a GitHub Pages workflow:

- [deploy-pages.yml](./.github/workflows/deploy-pages.yml)

After pushing to GitHub and enabling Pages with `GitHub Actions` as the source, the site can publish at:

- `https://<your-username>.github.io/<repo-name>/`

## Custom domain later

When you buy your own domain, attach it in the Render dashboard and point the DNS records from your registrar to Render.

## Local production test

```powershell
npm.cmd run build
npm.cmd start
```

Then open `http://127.0.0.1:8787`.
