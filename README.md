# weco-concept-explorer

This is a Next.js application configured for static export and deployment to GitHub Pages. It explores concepts for Weco.

## Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kenoir/weco-concept-explorer.git
    cd weco-concept-explorer
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- The `gh-pages` branch is automatically created and managed by the workflow.

## Live Site

The application is deployed via GitHub Pages and is available at:

[https://kenoir.github.io/weco-concept-explorer/](https://kenoir.github.io/weco-concept-explorer/)