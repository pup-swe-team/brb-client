// TODO: verify every value against Figma "Colors & Typography" (Figma wins).
export const colors = {
  primary: '#B2080C', primaryDark: '#81090B', gold: '#F5B301', goldSoft: '#FCE7A6',
  white: '#FFFFFF', bg: '#F5F7FA', bgAuth: '#F8F7FB', border: '#E8EBF0', borderStrong: '#D1D6E0',
  textMuted: '#9BA3B8', textSecondary: '#5B6589', text: '#1A1F3A', textStrong: '#2F3A66',
  success: '#2FAF8F', warning: '#E8A63D', error: '#D14C5C', info: '#4B7BE5', link: '#4B7BE5',
  disabled: '#9BADD9', overlay: 'rgba(26,31,58,0.5)',
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { input: 8, button: 8, card: 12, pill: 999 };
export const text = {
  h1: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, color: colors.textSecondary },
};
export const shadow = {
  card: { shadowColor: '#1A1F3A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
};
