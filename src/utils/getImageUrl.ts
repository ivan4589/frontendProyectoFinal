const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return `${API_URL}${imageUrl}`;
}