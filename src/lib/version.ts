// App version - injected from package.json at build time (see next.config.js),
// so `npm run version:*` is all that is needed to bump it.
export const APP_VERSION: string = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
