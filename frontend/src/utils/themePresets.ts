export interface ColorPreset {
  name: string;
  hex: string;
  hover: string;
  darkHex: string;
  light: string;
  light50: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Plum (v2 Default)', hex: '#442C43', hover: '#322031', darkHex: '#C4A5C3', light: '#EAE6EA', light50: '#F4F1F4' },
  { name: 'Pine Teal', hex: '#0F4C42', hover: '#0C3D35', darkHex: '#2DD4BF', light: '#E3F1EF', light50: '#F0F7F6' },
  { name: 'Slate Indigo', hex: '#2A364F', hover: '#1E273A', darkHex: '#93C5FD', light: '#E6EAF2', light50: '#F1F4F9' },
  { name: 'Royal Periwinkle', hex: '#3F5F94', hover: '#314B77', darkHex: '#8FACD9', light: '#EFF3F9', light50: '#F5F7FB' },
  { name: 'Warm Apricot', hex: '#D9734E', hover: '#BA5E3C', darkHex: '#E9A07F', light: '#FBEAE1', light50: '#FDF5F0' },
];

export function applyPrimaryColor(preset: ColorPreset) {
  document.documentElement.style.setProperty('--primary', preset.hex);
  document.documentElement.style.setProperty('--primary-hover', preset.hover);
  document.documentElement.style.setProperty('--primary-dark', preset.darkHex);
  document.documentElement.style.setProperty('--primary-light', preset.light);
  document.documentElement.style.setProperty('--primary-50', preset.light50);
  // Ensure --action and --action-hover are not overridden inline on root so dark mode switches to periwinkle properly
  document.documentElement.style.removeProperty('--action');
  document.documentElement.style.removeProperty('--action-hover');
  localStorage.setItem('integrum-custom-primary', preset.hex);
  localStorage.setItem('integrum-custom-primary-preset', JSON.stringify(preset));

  // Dispatch custom event to notify other instances
  window.dispatchEvent(new CustomEvent('integrum-color-change', { detail: preset }));
}

export function initPrimaryColor(): string {
  try {
    const savedJson = localStorage.getItem('integrum-custom-primary-preset');
    if (savedJson) {
      const preset: ColorPreset = JSON.parse(savedJson);
      applyPrimaryColor(preset);
      return preset.hex;
    }
    const savedColor = localStorage.getItem('integrum-custom-primary');
    if (savedColor) {
      const found = COLOR_PRESETS.find((p) => p.hex.toLowerCase() === savedColor.toLowerCase());
      if (found) {
        applyPrimaryColor(found);
        return found.hex;
      }
      document.documentElement.style.setProperty('--primary', savedColor);
      document.documentElement.style.removeProperty('--action');
      document.documentElement.style.removeProperty('--action-hover');
      return savedColor;
    }
  } catch (err) {
    console.error('Failed to init primary color', err);
  }
  return COLOR_PRESETS[0].hex;
}
