import React from 'react';
import { saveMapPreference } from '../../config/mapConfig';

const MapStyleSwitcher = ({ currentStyle, onStyleChange, className = '' }) => {
  const styles = [
    { id: 'light', name: '', icon: '☀️', description: 'Light Map' },
    { id: 'dark', name: '', icon: '🌙', description: 'Dark Map' }
  ];
  
  const handleStyleChange = (styleId) => {
    onStyleChange(styleId);
    saveMapPreference(styleId);
  };
  
  return (
    <div className={`map-style-switcher ${className}`}>
      {styles.map((style) => (
        <button
          key={style.id}
          onClick={() => handleStyleChange(style.id)}
          className={`map-style-btn ${currentStyle === style.id ? 'active' : ''}`}
          title={style.description}
        >
          <span className="style-icon">{style.icon}</span>
          <span className="style-name">{style.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MapStyleSwitcher;