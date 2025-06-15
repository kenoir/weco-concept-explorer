# Next.js GitHub Pages Client-Side App

This is a Next.js application configured for static export and deployment to GitHub Pages.

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kenoir/weco-concept-explorer.git
   cd weco-concept-explorer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

## Building for Production (Static Export)

To build the application for static export (as done by the CI/CD pipeline):
```bash
npm run build
```
This will generate the static files in the `out` directory.

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD.
- On every push to the `main` branch, the workflow in `.github/workflows/main.yml` is triggered.
- The workflow installs dependencies, builds the Next.js application (static export), and deploys the content of the `out` directory to the `gh-pages` branch.
- The site will be available at `https://kenoir.github.io/weco-concept-explorer/`.

**Note:** Replace `kenoir` with the actual GitHub username or organization name where this repository is hosted.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.