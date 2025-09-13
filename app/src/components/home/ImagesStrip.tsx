import type { DeepResult, DeepImage } from '../../types';

function normalize(images?: DeepResult['images']): DeepImage[] {
    if (!images || !Array.isArray(images)) return [];

    return images.slice(0, 3).map((img, i) => {
        // Handle string format
        if (typeof img === 'string') {
            return { src: img, alt: `Result image ${i + 1}` };
        }
        // Handle object format
        return {
            src: img.url || img.src || '',
            alt: img.alt || `Result image ${i + 1}`
        };
    }).filter(img => img.src); // Remove empty sources
}

type Props = {
    images?: DeepResult['images'];
    onImageClick?: (src: string) => void;
};

export default function ImagesStrip({ images, onImageClick }: Props) {
    const normalizedImages = normalize(images);

    if (normalizedImages.length === 0) return null;

    return (
        <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Images</div>
            <div className="result-images">
                {normalizedImages.map((img, i) => (
                    <div
                        key={i}
                        className="result-image"
                        onClick={() => onImageClick?.(img.src)}
                    >
                        <img
                            src={img.src}
                            alt={img.alt}
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}