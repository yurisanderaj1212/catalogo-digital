// Configuración de Cloudinary para subida de imágenes

// IMPORTANTE: Estas son las credenciales públicas (solo para subida desde cliente)
// No expongas el API Secret aquí

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset',
};

/**
 * Sube una imagen a Cloudinary desde el navegador
 * @param file - Archivo de imagen seleccionado por el usuario
 * @param folder - Carpeta en Cloudinary (ej: 'productos', 'logos')
 * @returns URL pública de la imagen subida
 */
export async function uploadToCloudinary(
  file: File,
  folder: 'productos' | 'logos' = 'productos'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);
  
  // Optimizaciones automáticas
  formData.append('quality', 'auto');
  formData.append('fetch_format', 'auto');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir imagen a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url; // URL HTTPS de la imagen
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error);
    throw error;
  }
}

/**
 * Obtiene una URL optimizada de Cloudinary
 * @param publicId - ID público de la imagen en Cloudinary
 * @param transformations - Transformaciones opcionales
 * @returns URL optimizada
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale';
    quality?: 'auto' | number;
  }
): string {
  const { cloudName } = CLOUDINARY_CONFIG;
  const { width, height, crop = 'fill', quality = 'auto' } = transformations || {};

  let transform = '';
  if (width) transform += `w_${width},`;
  if (height) transform += `h_${height},`;
  if (crop) transform += `c_${crop},`;
  transform += `q_${quality},f_auto`;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

/**
 * Valida si una URL es de Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com');
}
