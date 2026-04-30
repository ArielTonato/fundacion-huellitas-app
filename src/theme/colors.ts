export const Colors = {
  primary: '#1F3A56',
  secondary: '#4CAF96',
  accent: '#FF8F4A',
  background: '#F4E6D2',
  neutralMid: '#A88F79',
  neutralLight: '#F2F4F7',
  textPrimary: '#0F1F2E',
  textSecondary: '#6B7C87',
  error: '#E53935',
  whatsapp: '#25D366',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof Colors;
