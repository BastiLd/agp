# ResuMax Clone

A 1:1 clone of the ResuMax.ai website built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Modern Stack**: Built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS
- **Responsive Design**: Fully responsive layout for mobile, tablet, and desktop
- **Dark Theme**: Beautiful dark theme with pink/purple gradients
- **Animations**: Smooth animations and transitions throughout
- **Component-Based**: Modular component architecture for easy maintenance

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
resumax-clone/
├── app/
│   ├── layout.tsx          # Root layout with Navigation
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles & Tailwind config
├── components/
│   ├── Navigation.tsx      # Header Navigation
│   ├── Hero.tsx            # Hero Section
│   ├── FeatureCards.tsx    # AI Powered, ATS Pass-Through, Interview Boost
│   ├── ATSAnalysis.tsx     # Resume preview section
│   ├── ResuMaxScore.tsx    # Score upload section
│   ├── CompanyLogos.tsx    # Company logos carousel
│   ├── Templates.tsx       # Template showcase
│   ├── Pricing.tsx         # Pricing plans
│   └── Footer.tsx          # Footer section
├── public/
│   └── assets/            # Static assets (images, etc.)
└── package.json
```

## Technologies Used

- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Geist Font**: Modern font family
- **React**: UI library

## Customization

### Colors

The color scheme can be customized in `tailwind.config.ts`:
- Primary: `pink-400`, `purple-400`
- Background: `slate-900`, `#14213d`
- Text: `white`, `slate-300`

### Components

All components are located in the `components/` directory and can be easily modified or extended.

## Build for Production

```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm start
# or
yarn start
```

## License

This is a clone project for educational purposes.

