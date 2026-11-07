
const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAIN_MAX_DIMENSION = 1920;
const THUMBNAIL_MAX_DIMENSION = 480;
const MAX_PROCESSED_SIZE = 10 * 1024 * 1024;

export interface ProcessedFeedbackImage {
    image: Blob;
    thumbnail: Blob;
}

function resizeDimensions(
    width: number,
    height: number,
    maxDimension: number
) {
    const scale = Math.min(
        1,
        maxDimension / Math.max(width, height)
    );

    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
    };
}

function canvasToWebP(
    canvas: HTMLCanvasElement,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Image conversion failed."));
                    return;
                }

                if (blob.type !== "image/webp") {
                    reject(
                        new Error("Your browser does not support WebP conversion.")
                    );
                    return;
                }

                resolve(blob);
            },
            "image/webp",
            quality
        );
    });
}

async function createWebP(
    bitmap: ImageBitmap,
    maxDimension: number,
    quality: number
): Promise<Blob> {
    const qualityLevels = [
        quality,
        quality - 0.12,
        quality - 0.24,
        quality - 0.34,
    ];

    for (let attempt = 0; attempt < qualityLevels.length; attempt++) {
        const dimensions = resizeDimensions(
            bitmap.width,
            bitmap.height,
            Math.round(maxDimension * Math.pow(0.85, attempt))
        );

        const canvas = document.createElement("canvas");

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Could not process the selected image.");
        }

        context.drawImage(
            bitmap,
            0,
            0,
            dimensions.width,
            dimensions.height
        );

        const blob = await canvasToWebP(
            canvas,
            qualityLevels[attempt]
        );

        if (blob.size <= MAX_PROCESSED_SIZE) {
            return blob;
        }
    }

    throw new Error(
        "Could not compress this image below the 10 MB limit."
    );
}

export async function processFeedbackImage(
    file: File
): Promise<ProcessedFeedbackImage> {
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Unsupported image format.");
    }

    if (file.size > MAX_ORIGINAL_SIZE) {
        throw new Error("Image exceeds the 10 MB limit.");
    }

    const bitmap = await createImageBitmap(file);

    try {
        const image = await createWebP(
            bitmap,
            MAIN_MAX_DIMENSION,
            0.82
        );

        const thumbnail = await createWebP(
            bitmap,
            THUMBNAIL_MAX_DIMENSION,
            0.75
        );

        return {
            image,
            thumbnail,
        };
    } finally {
        bitmap.close();
    }
}
