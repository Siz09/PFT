import type { PluginOption } from 'vite';

declare module '@tailwindcss/vite' {
  const tailwindVite: (...args: unknown[]) => PluginOption;
  export default tailwindVite;
}
