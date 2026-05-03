export const MAP_STYLES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
    className: 'leaflet-map-light'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
    className: 'leaflet-map-dark'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
    className: 'leaflet-map-street'
  }
};

export const getSavedMapPreference = () => {
  try {
    const saved = localStorage.getItem('mapStyle');
    return saved && MAP_STYLES[saved] ? saved : 'light';
  } catch {
    return 'light';
  }
};

export const saveMapPreference = (style) => {
  try {
    if (MAP_STYLES[style]) localStorage.setItem('mapStyle', style);
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
};

export const getRouteColor = (style) => ({
  route: style === 'dark' ? '#FFFFFF' : '#000000',
  start: '#10B981',
  end:   '#EF4444'
});