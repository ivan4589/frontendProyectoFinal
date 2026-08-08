import { environment } from '../config/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api$/, '');

export function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return `${API_ORIGIN}${imageUrl}`;
}
