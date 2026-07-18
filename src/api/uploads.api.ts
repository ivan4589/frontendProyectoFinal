import { api } from './axios';

export interface UploadImageResponse {
  imageUrl: string;
}

export async function uploadProductImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<UploadImageResponse>(
    '/products/upload-image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}