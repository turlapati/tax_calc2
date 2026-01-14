# Advanced Post-Tax Income Calculator

A React + TypeScript web application that calculates the gross pre-tax income required to achieve a desired post-tax income, considering federal, state, and local taxes across all US states.

## Features

- Calculate required gross income for multiple scenarios (up to 4)
- Compare different work/residence state combinations
- Federal income tax (2025 brackets)
- State income tax (all 50 states + DC)
- City/local income tax (NYC, etc.)
- FICA taxes (Social Security & Medicare)
- State Disability Insurance (SDI/PFML)
- Pre-tax benefit deductions (401k, HSA, FSA, health insurance, etc.)
- Multiple filing statuses (Single, Married Filing Jointly, etc.)

## Quick Start

```bash
cd web
npm install
npm run dev
```

## Additional Features

- Visual comparison charts (stacked bar + pie)
- Export results (CSV/image)
- Share scenarios via URL
- Preset scenario templates
- Dark/light theme (dark by default)
- Keyboard shortcuts (Ctrl+Enter to calculate, Ctrl+N to add scenario)
- Currency input formatting

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest + Testing Library

## Development

```bash
cd web
npm install
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run test        # Run tests (watch mode)
npm run test:run    # Run tests (single run)
npm run lint        # Run ESLint
```

## Deployment

### Cloudflare Pages (Recommended)

1. Push this repository to GitHub/GitLab
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Create a new project and connect your repository
4. Configure build settings:
   - **Framework preset:** None (or Vite)
   - **Root directory:** `web`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Deploy

The app includes `_headers` and `_redirects` files for proper SPA routing and security headers.

### Environment Variables (Optional)

| Variable | Description |
|----------|-------------|
| `VITE_TAX_DATA_URL` | Remote URL for fetching tax data (falls back to bundled data) |

## Project Structure

```
TaxCalc/
├── web/                    # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks
│   │   ├── services/       # Business logic
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── types/          # TypeScript types
│   │   └── data/           # Tax data JSON
│   ├── _headers            # Cloudflare security headers
│   ├── _redirects          # SPA routing config
│   └── wrangler.toml       # Cloudflare config
├── product-requirements.md # Full PRD
└── README.md
```

## Tax Data

Tax brackets and rates are based on 2025 tax year estimates. The data includes:

- Federal tax brackets for all filing statuses
- State income tax rates for all 50 states + DC
- City income tax rates (NYC, Yonkers, etc.)
- FICA rates and wage bases
- SDI/PFML rates for applicable states (CA, NY, NJ, etc.)

### Updating Tax Data

1. Edit `web/src/data/tax-data-2025.json`
2. Rebuild and deploy

### Remote Updates (Optional)

1. Host JSON files on a CDN (e.g., `https://cdn.example.com/tax-data-2025.json`)
2. Set environment variable: `VITE_TAX_DATA_URL=https://cdn.example.com`
3. App will fetch and cache remote data with 24-hour expiry

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Calculate all scenarios |
| `Ctrl+N` / `Cmd+N` | Add new scenario |

## Disclaimer

This calculator provides estimates based on simplified 2025 tax rules. It does not include all possible deductions, credits, or special circumstances. Consult a qualified tax professional for accurate tax advice.

## License

MIT
