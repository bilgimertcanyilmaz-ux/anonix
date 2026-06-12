/**
 * İstemci tarafı görsel sıkıştırma (Gölge yüklemeleri için).
 *
 * Neden: Kullanıcılar 10MB'a kadar orijinal fotoğraf yüklüyordu ve feed bu
 * dosyaları olduğu gibi indiriyordu. Yükleme öncesi uzun kenarı sınırlayıp
 * JPEG'e çevirmek dosyayı tipik olarak %90+ küçültür.
 *
 * GIF'ler (animasyon bozulmasın) ve zaten küçük dosyalar olduğu gibi bırakılır.
 */

const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 0.82;
/** Bu boyutun altındaki dosyalara dokunma (zaten yeterince küçük). */
const SKIP_BELOW_BYTES = 300 * 1024;

export async function compressImage(file: File): Promise<File> {
  // Animasyonlu formatlara (GIF + animasyonlu olabilen WebP) ve küçük dosyalara dokunma.
  if (
    file.type === "image/gif" ||
    file.type === "image/webp" ||
    file.size <= SKIP_BELOW_BYTES
  )
    return file;

  try {
    // EXIF yönünü uygula (dikey telefon fotoğrafları yan dönmesin);
    // opsiyonu tanımayan eski tarayıcılarda opsiyonsuz çağrıya düş.
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = await createImageBitmap(file);
    }
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    // Küçültme gerekmiyorsa ve dosya zaten JPEG ise yeniden kodlamaya değmeyebilir;
    // yine de büyük PNG'leri JPEG'e çevirmek için devam ediyoruz.
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // PNG şeffaflığı JPEG'de siyaha döner — koyu tema zemini ile uyumlu beyaz yerine
    // nötr koyu zemin bas (Gölge kartları koyu).
    ctx.fillStyle = "#0b0817";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    // Sıkıştırma işe yaramadıysa (nadiren küçük JPEG'lerde) orijinali kullan.
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // createImageBitmap desteklenmiyorsa / bozuk dosyada: orijinalle devam.
    return file;
  }
}
