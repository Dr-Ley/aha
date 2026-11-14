export const brandThemes = {
  nike: {
    // Nike doesn’t typically use bright gradients in its core brand identity;
    // it's more monochrome or solid. But we can use a subtle dark gradient.
    topNavbarBg: 'linear-gradient(90deg, #1f1f1f, #444444)',  
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(180deg, #333333, #111111)',
    brandNavbarText: '#ffffff',
    sectionTitleColor: '#000000',
    accentColor: '#000000',
  },
  adidas: {
    // Minimalist black-and-white theme
    topNavbarBg: 'linear-gradient(90deg, #000000, #000000)',  
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(180deg, #ffffff, #f5f5f5)',
    brandNavbarText: '#000000',
    sectionTitleColor: '#000000',
    accentColor: '#000000',
  },
  zara: {
    // Zara is very minimal / monochrome :contentReference[oaicite:0]{index=0}  
    topNavbarBg: 'linear-gradient(90deg, #000000, #000000)',  
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(90deg, #ffffff, #f5f5f5)',
    brandNavbarText: '#000000',
    sectionTitleColor: '#000000',
    accentColor: '#000000',
  },
  levis: {
    // Levi's uses strong red, but we can introduce a red gradient to feel dynamic.
    topNavbarBg: 'linear-gradient(90deg, #ff0000, #cc0000)',  
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(180deg, #cc0000, #660000)',
    brandNavbarText: '#ffffff',
    sectionTitleColor: '#cc0000',
    accentColor: '#ff0000',
  },
  'lc-waikiki': {
    // Bright blue gradient to reflect the brand color
    topNavbarBg: 'linear-gradient(90deg, #4169e1, #87cefa)',  
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(180deg, #87cefa, #ffffff)',
    brandNavbarText: '#4169e1',
    sectionTitleColor: '#4169e1',
    accentColor: '#4169e1',
  },
  'hugo-boss': {
    // Boss is typically quite bold. Use a dark gradient + red accent.
    topNavbarBg: 'linear-gradient(90deg, #000000, #333333)',  
    topNavbarText: '#ff0000',
    brandNavbarBg: 'linear-gradient(180deg, #333333, #000000)',
    brandNavbarText: '#ff0000',
    sectionTitleColor: '#000000',
    accentColor: '#ff0000',
  },
  woolworths: {
    // Woolworths is more neutral – keep it simple but maybe slight grey gradient
    topNavbarBg: 'linear-gradient(90deg, #ffffff, #eeeeee)',
    topNavbarText: '#000000',
    brandNavbarBg: 'linear-gradient(180deg, #eeeeee, #dddddd)',
    brandNavbarText: '#000000',
    sectionTitleColor: '#888888',
    accentColor: '#000000',
  },
  default: {
    topNavbarBg: 'linear-gradient(90deg, #dc2626, #b91c1c)',
    topNavbarText: '#ffffff',
    brandNavbarBg: 'linear-gradient(180deg, #ffffff, #f5f5f5)',
    brandNavbarText: '#000000',
    sectionTitleColor: '#000000',
    accentColor: '#dc2626',
  },
};


export const getBrandTheme = (brandSlug) => {
  if (!brandSlug) return brandThemes.default;
  const normalizedSlug = brandSlug.toLowerCase().replace(/\s+/g, '-');
  return brandThemes[normalizedSlug] || brandThemes.default;
};

export const applyBrandTheme = (theme) => {
  const root = document.documentElement;
  root.style.setProperty('--brand-top-navbar-bg', theme.topNavbarBg);
  root.style.setProperty('--brand-top-navbar-text', theme.topNavbarText);
  root.style.setProperty('--brand-navbar-bg', theme.brandNavbarBg);
  root.style.setProperty('--brand-navbar-text', theme.brandNavbarText);
  root.style.setProperty('--brand-section-title-color', theme.sectionTitleColor);
  root.style.setProperty('--brand-accent-color', theme.accentColor);
};
