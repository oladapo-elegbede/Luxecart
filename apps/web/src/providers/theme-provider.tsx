"use client";

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Theme Provider.
 *
 * Wraps the app with next-themes for dark mode support.
 *
 * BEHAVIORS:
 *   - Defaults to system preference (matches OS)
 *   - Persists user's choice in localStorage
 *   - Switches HTML class between 'light' and 'dark'
 *   - Tailwind picks up the class for styling
 *
 * USAGE in components:
 *   import { useTheme } from 'next-themes';
 *   const { theme, setTheme } = useTheme();
 *   <button onClick={() => setTheme('dark')}>Dark mode</button>
 *
 * IMPORTANT: suppressHydrationWarning on <html> in layout.tsx
 *   prevents React warnings during the initial theme detection.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}