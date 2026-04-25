import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import multer from "multer";
import { BadRequestError } from "../errors";
import s3Client from "../config/s3.config";

// Configuración centralizada para no tener números mágicos dispersos
const S3_CONFIG = {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
    outputSizePx: 500,                  // 500x500 px de salida
    bucket: process.env.AWS_S3_BUCKET_NAME!,
} as const;

// Multer con memoryStorage: el archivo queda en req.file.buffer
// No toca el disco, vive en RAM hasta que lo procesamos
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: S3_CONFIG.maxFileSizeBytes },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes en formato jpeg, png o webp."));
        }
    },
});

// Valida el ratio y sube la imagen procesada a S3
// Devuelve la URL pública del archivo subido
export async function uploadImageToS3(
    buffer: Buffer,
    folder: "products" | "stores"   // así organizamos el bucket en carpetas
): Promise<string> {

    // sharp.metadata() lee el header del archivo para obtener dimensiones reales
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
        throw new BadRequestError("No se pudo leer las dimensiones de la imagen.");
    }

    // Procesamos con sharp: redimensionamos a 500x500 y convertimos a webp
    // WebP es el formato moderno: mejor compresión que jpeg con calidad similar
    const processedBuffer = await sharp(buffer)
        .resize(S3_CONFIG.outputSizePx, S3_CONFIG.outputSizePx)
        .webp({ quality: 80 })
        .toBuffer();

    // Generamos un nombre único usando timestamp + número aleatorio
    // para evitar colisiones si dos usuarios suben a la vez
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

    await s3Client.send(new PutObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: key,
        Body: processedBuffer,
        ContentType: "image/webp",
    }));

    // Construimos la URL pública (el bucket debe tener acceso público configurado)
    return `https://${S3_CONFIG.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Útil cuando actualizas la imagen: borra la anterior para no acumular archivos huérfanos
export async function deleteImageFromS3(imageUrl: string): Promise<void> {
    // Extraemos el key de la URL completa
    const url = new URL(imageUrl);
    const key = url.pathname.slice(1); // quitamos el "/" inicial

    await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: key,
    }));
}