# Kraken Labs Video Transcriber - Landing Page

This directory contains the landing page for the Kraken Labs Video Transcriber application, designed to be deployed on GitHub Pages.

## Files Included

-   `index.html` - Main landing page with modern, responsive design
-   `*.png` - Application screenshots and logo
-   `README.md` - This file
-   `RELEASE.md` - Release documentation
-   `FFMPEG_INTEGRATION.md` - FFmpeg integration documentation

## Features of the Landing Page

-   **Modern Design**: Beautiful gradient backgrounds, glass-morphism effects, and smooth animations
-   **Responsive**: Fully responsive design that works on desktop, tablet, and mobile
-   **Dark Mode Support**: Automatic dark mode detection and styling
-   **Interactive Elements**: Hover effects, smooth scrolling, and animated elements
-   **SEO Optimized**: Proper meta tags, structured content, and semantic HTML

## Sections Included

1. **Hero Section**: Eye-catching introduction with call-to-action buttons
2. **Features**: Highlighted app capabilities with icons and descriptions
3. **Screenshots**: Gallery of application screenshots with descriptions
4. **Usage Guide**: Step-by-step instructions for using the app
5. **Supported Services**: Information about compatible APIs and services
6. **Installation**: Download options and build instructions
7. **Footer**: Links and additional information

## 🚀 Simple GitHub Pages Deployment

No GitHub Actions workflow needed! Just configure directly in your repository:

### Easy Setup Steps:

1. **Push your changes** to the main branch
2. **Go to GitHub repository settings** → Pages (in the left sidebar)
3. **Configure source**:
    - Source: "Deploy from a branch"
    - Branch: `main`
    - Folder: `/docs`
4. **Save** and wait a few minutes
5. **Your site will be live** at: `https://[username].github.io/[repository-name]/`

### Alternative: Root Deployment

If you prefer the landing page at the root URL:

1. Copy `index.html` and all `*.png` files to the repository root
2. In GitHub Pages settings, select "/ (root)" instead of "/docs"

## Local Development

To test the landing page locally:

1. Navigate to the `docs` directory
2. Open `index.html` in a web browser
3. Or use a local server:

    ```bash
    # Using Python
    python -m http.server 8000

    # Using Node.js (if you have live-server installed)
    npx live-server
    ```

## Customization

The landing page uses:

-   **Tailwind CSS**: Loaded from CDN for styling
-   **Custom CSS**: Embedded styles for animations and effects
-   **Vanilla JavaScript**: For smooth scrolling and navigation effects

To customize:

1. Edit the HTML content in `index.html`
2. Modify colors, fonts, and layouts using Tailwind classes
3. Update screenshots by replacing the PNG files
4. Adjust animations and effects in the `<style>` section

## Browser Compatibility

The landing page is compatible with:

-   Chrome (latest)
-   Firefox (latest)
-   Safari (latest)
-   Edge (latest)

## Performance

-   Lightweight design with minimal dependencies
-   Optimized images and CSS
-   Fast loading times
-   Mobile-friendly responsive design

## Support

For issues with the landing page or deployment, please create an issue in the main repository.
