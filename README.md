# 🛒 Smart Grocery Companion

A modern, mobile-first Progressive Web App (PWA) for managing grocery lists with AI-powered categorization.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)

## ✨ Features

### 📝 Smart Input & AI Categorization
- **Paste full lists** - Copy from notes, messages, or anywhere and paste multiple items at once
- **AI-powered categorization** - Uses Google Gemini to automatically categorize items
- **Keyword fallback** - Works offline with smart keyword matching
- **Quantity detection** - Recognizes patterns like "milk x3", "2kg apples", "טונה x8"

### 🛍️ Shopping Mode
- **One-handed operation** - Large touch targets optimized for in-store use
- **Tap to check off** - Quick item completion
- **Swipe gestures** - Swipe left to mark as "Out of Stock"
- **Progress tracking** - Visual progress bar shows completion status
- **Picked items section** - Easily restore accidentally checked items

### 🌍 Bilingual Support
- **English & Hebrew** - Full RTL (Right-to-Left) support
- **Auto-detection** - Recognizes item language for proper categorization

### 📂 Categories
Pre-configured categories with smart defaults:
- 🍎 Fruits
- 🥕 Vegetables  
- 🥛 Dairy
- 🥩 Meat
- 🥖 Bakery
- 🧁 Baking
- ❄️ Frozen
- 🥤 Beverages
- 🍪 Snacks
- 🏠 Household
- 💄 Personal Care
- 🥫 Canned
- 📦 Other

### 💾 Data & Sharing
- **Local storage** - All data stored locally on your device
- **Share lists** - Generate share links or codes
- **Favorites** - Save frequently bought items for quick access

### 📱 PWA Features
- **Install as app** - Add to home screen on any device
- **Offline support** - Works without internet connection
- **Fast & responsive** - Optimized for mobile performance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/meiriv/Grocery.git
   cd Grocery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

## 📱 Install as Mobile App (PWA)

This app can be installed on your phone and used like a native app - no app store required!

### iPhone / iPad (Safari)
1. Open the app in **Safari** (must be Safari, not Chrome)
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Give it a name and tap **"Add"**
5. The app icon will appear on your home screen

### Android (Chrome)
1. Open the app in **Chrome**
2. Tap the **three dots menu** (⋮) in the top right
3. Tap **"Add to Home screen"** or **"Install app"**
4. Confirm by tapping **"Add"**
5. The app icon will appear on your home screen

### Desktop (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Click the **install icon** (⊕) in the address bar, or
3. Click the three dots menu → **"Install Smart Grocery..."**

> 💡 **Tip**: Once installed, the app works offline and opens in full-screen mode without browser UI!

## ⚙️ Configuration

### AI Categorization (Optional)

To enable AI-powered categorization with Google Gemini:

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open the app and go to **Settings**
3. Enable **AI Categorization**
4. Enter your API key
5. Click **Test Connection** to verify

The app works perfectly without AI - it uses intelligent keyword matching as a fallback.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home - list of grocery lists
│   ├── list/[id]/         # Individual list view
│   │   ├── page.tsx       # List editing
│   │   └── shopping/      # Shopping mode
│   ├── favorites/         # Favorites management
│   ├── categories/        # Category management
│   └── settings/          # App settings
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── SmartInput.tsx    # AI-powered input
│   ├── GroceryItem.tsx   # Item display & interactions
│   ├── CategoryGroup.tsx # Grouped item display
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useGroceryList.ts # List state management
│   ├── useTranslation.tsx# i18n support
│   └── ...
├── services/              # Business logic
│   ├── gemini-client.ts  # Google Gemini API
│   ├── categorizer.ts    # Item categorization
│   ├── storage.ts        # LocalStorage operations
│   └── ...
├── lib/                   # Utilities
│   ├── categories.ts     # Category definitions
│   ├── units.ts          # Unit types & defaults
│   └── utils.ts          # Helper functions
├── i18n/                  # Translations
│   ├── en.ts             # English
│   └── he.ts             # Hebrew
└── types/                 # TypeScript types
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **Storage**: LocalStorage (client-side)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

Made with ❤️ for easier grocery shopping

