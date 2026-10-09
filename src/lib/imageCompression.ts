/**
 * Utilitas kompresi gambar client-side via HTML5 Canvas
 * Mengubah file kamera/gambar berukuran besar (3MB - 10MB) menjadi JPEG ringan (~50KB - 120KB)
 * Menghindari memory lag dan quota limit pada browser localStorage.
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    // Jika bukan file gambar atau format SVG/GIF, langsung baca apa adanya
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('/teachers/default_avatar.svg');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Hasilkan JPEG berukuran kecil (~80-120KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string || '/teachers/default_avatar.svg');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('/teachers/default_avatar.svg');
    reader.readAsDataURL(file);
  });
}
