# MyBase

A customizable, drag-and-drop dashboard platform for crypto users built specifically for the Base blockchain network. Create your perfect dashboard by arranging widgets exactly how you want them.

## What is MyBase?

MyBase is a white-label, fully customizable crypto dashboard that puts you in control. Connect your wallet, add widgets, drag them around, resize them, and create multiple layouts for different use cases. Whether you're tracking prices, monitoring gas fees, or keeping an eye on trending tokens, MyBase gives you the flexibility to build the dashboard that works for you.

## ✨ Features

### 🎨 Fully Customizable Dashboard
- **Drag & Drop**: Arrange widgets exactly where you want them
- **Resizable Widgets**: Adjust widget sizes to fit your needs
- **Multiple Layouts**: Create and switch between different dashboard layouts
- **Widget Customization**: Toggle titles, subtitles, and widget variants
- **Fixed Widgets**: Lock widgets in place to prevent accidental moves

### 🔌 Wallet Integration
- Connect with popular wallets (MetaMask, Coinbase Wallet, Trust Wallet, and more)
- Automatic Base network detection and switching
- View your wallet balance directly in the dashboard

### 📊 Available Widgets

- **Price Tracker**: Monitor real-time prices for multiple tokens
- **Price Chart**: Visualize token price history with interactive charts
- **Gas Tracker**: Keep an eye on Base network gas prices
- **Fear & Greed Index**: Track market sentiment
- **Trending Tokens**: Discover what's hot on Base


## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A Supabase account (for user data storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/my-base.git
cd my-base
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration (optional)
NEXT_PUBLIC_APP_NAME=mybase
NEXT_PUBLIC_TAGLINE=MyBase, my rules — drag, drop, make it yours
NEXT_PUBLIC_NETWORK=base

# Social Links (optional)
NEXT_PUBLIC_TWITTER_URL=
NEXT_PUBLIC_DISCORD_URL=
NEXT_PUBLIC_GITHUB_URL=
NEXT_PUBLIC_DOCS_URL=
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI**: React 19, Tailwind CSS 4
- **Wallet Integration**: [wagmi](https://wagmi.sh/) & [viem](https://viem.sh/)
- **Database**: [Supabase](https://supabase.com/)
- **Grid Layout**: [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [HugeIcons](https://hugeicons.com/)

## 📁 Project Structure

```
my-base/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.js            # Main dashboard page
│   └── profile/           # User profile pages
├── components/
│   ├── cards/             # Card components
│   ├── dashboard/         # Dashboard components
│   ├── form/              # Form components
│   ├── providers/         # React context providers
│   ├── shared/            # Shared components (Header, Modals, etc.)
│   ├── ui/                # UI primitives (Button, Modal, etc.)
│   └── widgets/           # Dashboard widgets
├── config/                # Configuration files
│   ├── api-endpoints.js   # API endpoint definitions
│   ├── apis.js            # API client configurations
│   ├── base-tokens.js     # Base network token list
│   └── networks.js        # Network configurations
├── lib/                   # Core libraries and utilities
│   ├── api/               # API clients (CoinGecko, BaseScan, etc.)
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
└── public/                # Static assets
```

## ⚙️ Configuration

MyBase is highly configurable through the `lib/config.js` file. You can:

- Customize branding and colors
- Enable/disable features via feature flags
- Configure default widgets and layouts
- Set limits (max layouts, widgets per layout, etc.)
- Customize network-specific settings

## 🎨 Customization

### Adding New Widgets

1. Create a new widget component in `components/widgets/`
2. Export it from `components/widgets/index.js`
3. Add it to the `WIDGET_COMPONENTS` mapping in `ResizableWidgetGrid.jsx`
4. Register it in the widgets modal

### Network Support

While MyBase is currently optimized for Base, the architecture supports multiple networks. Network configuration is managed in `config/networks.js`.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Base Network](https://base.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

Built with ❤️ for the Base ecosystem
