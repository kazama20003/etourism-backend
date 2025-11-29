// Idiomas soportados en el sistema
export const SUPPORTED_LANGS = [
  'es', // Español
  'en', // Inglés
  'fr', // Francés
  'it', // Italiano
  'de', // Alemán
  'pt', // Portugués
  'zh', // Chino
  'ja', // Japonés
  'ru', // Ruso
] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

// Idioma base / por defecto del contenido
export const DEFAULT_LANG: Lang = 'es';
