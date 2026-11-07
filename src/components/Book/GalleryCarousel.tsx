import {
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
} from "react";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./GalleryCarousel.css";

interface GalleryCarouselProps {
    images: string[];
    title: string;
}

const AUTO_SPEED = 1;
const DRAG_THRESHOLD = 100;

export default function GalleryCarousel({
    images,
    title,
}: GalleryCarouselProps) {
    const validImages = images.filter(
        (image) => typeof image === "string" && image.trim().length > 0
    );

    const trackRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const positionRef = useRef(0);
    const singleSetWidthRef = useRef(0);

    const pointerDownRef = useRef(false);
    const draggedRef = useRef(false);
    const startXRef = useRef(0);
    const startPositionRef = useRef(0);

    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    const repeatedImages = [
        ...validImages,
        ...validImages,
        ...validImages,
    ];

    const getSingleSetWidth = () => {
        const track = trackRef.current;

        if (!track || validImages.length === 0) return 0;

        const firstItem = track.children[0] as HTMLElement;
        const secondSetFirstItem = track.children[validImages.length] as HTMLElement;

        if (!firstItem || !secondSetFirstItem) return 0;

        return secondSetFirstItem.offsetLeft - firstItem.offsetLeft;
    };

    const updatePosition = () => {
        const track = trackRef.current;

        if (!track) return;

        const singleSetWidth = singleSetWidthRef.current || getSingleSetWidth();

        if (!singleSetWidth) return;

        singleSetWidthRef.current = singleSetWidth;

        // Keep the track inside the three-copy looping region.
        while (positionRef.current >= 0) {
            positionRef.current -= singleSetWidth;
        }

        while (positionRef.current <= -singleSetWidth * 2) {
            positionRef.current += singleSetWidth;
        }

        track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
    };

    // Initialize the carousel in the middle image set.
    useEffect(() => {
        if (validImages.length === 0) return;

        const frame = requestAnimationFrame(() => {
            const track = trackRef.current;

            if (!track) return;

            const singleSetWidth = getSingleSetWidth();

            singleSetWidthRef.current = singleSetWidth;
            positionRef.current = -singleSetWidth;

            track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
        });

        return () => cancelAnimationFrame(frame);
    }, [validImages.length]);

    // Continuously move to the right.
    useEffect(() => {
        if (validImages.length === 0) return;

        let animationFrame = 0;
        let previousTime = 0;

        const animate = (time: number) => {
            if (!previousTime) previousTime = time;

            const delta = Math.min((time - previousTime) / 16.67, 3);
            previousTime = time;

            const paused =
                pointerDownRef.current ||
                isDragging ||
                selectedImage !== null;

            if (!paused) {
                positionRef.current += AUTO_SPEED * delta;
                updatePosition();
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [validImages.length, isDragging, selectedImage]);

    // Keep the carousel width and position correct after resizing.
    useEffect(() => {
        const track = trackRef.current;

        if (!track || validImages.length === 0) return;

        const observer = new ResizeObserver(() => {
            const singleSetWidth = getSingleSetWidth();

            if (!singleSetWidth) return;

            singleSetWidthRef.current = singleSetWidth;
            positionRef.current = -singleSetWidth;

            track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
        });

        observer.observe(track);

        return () => observer.disconnect();
    }, [validImages.length]);

    // Pause page scrolling while the expanded image is open.
    useEffect(() => {
        if (selectedImage === null) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedImage(null);
            }

            if (event.key === "ArrowLeft") {
                setSelectedImage((current) =>
                    current === null
                        ? current
                        : (current - 1 + validImages.length) % validImages.length
                );
            }

            if (event.key === "ArrowRight") {
                setSelectedImage((current) =>
                    current === null
                        ? current
                        : (current + 1) % validImages.length
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedImage]);

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary || event.button !== 0) return;

        pointerDownRef.current = true;
        draggedRef.current = false;

        startXRef.current = event.clientX;
        startPositionRef.current = positionRef.current;

        viewportRef.current?.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!pointerDownRef.current) return;

        const distance = event.clientX - startXRef.current;

        if (
            !draggedRef.current &&
            Math.abs(distance) > DRAG_THRESHOLD
        ) {
            draggedRef.current = true;
            setIsDragging(true);
        }

        if (!draggedRef.current) return;

        positionRef.current = startPositionRef.current + distance;
        updatePosition();
    };

    const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointerDownRef.current = false;
        setIsDragging(false);

        if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
            viewportRef.current.releasePointerCapture(event.pointerId);
        }
    };

    const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
        pointerDownRef.current = false;
        draggedRef.current = false;
        setIsDragging(false);

        if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
            viewportRef.current.releasePointerCapture(event.pointerId);
        }
    };

    const handleImageClick = (index: number) => {
        if (draggedRef.current) {
            draggedRef.current = false;
            return;
        }

        setSelectedImage(index);
    };

    const showPreviousImage = () => {
        setSelectedImage((current) => {
            if (current === null || validImages.length === 0) return current;

            return (current - 1 + validImages.length) % validImages.length;
        });
    };

    const showNextImage = () => {
        setSelectedImage((current) => {
            if (current === null || validImages.length === 0) return current;

            return (current + 1) % validImages.length;
        });
    };

    if (validImages.length === 0) return null;

    return (
        <>
            <div className="gallery-carousel">
                <div
                    ref={viewportRef}
                    className={`gallery-carousel__viewport ${isDragging ? "is-dragging" : ""
                        }`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                >
                    <div
                        ref={trackRef}
                        className="gallery-carousel__track"
                    >
                        {repeatedImages.map((image, index) => {
                            const originalIndex = index % validImages.length;

                            return (
                                <button
                                    key={`${originalIndex}-${index}`}
                                    type="button"
                                    className="gallery-carousel__item"
                                    aria-label={`View ${title} image ${originalIndex + 1}`}
                                    onClick={() => handleImageClick(originalIndex)}
                                >
                                    <img
                                        src={image}
                                        alt={`${title} ${originalIndex + 1}`}
                                        draggable={false}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedImage !== null && (
                <div
                    className="gallery-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${title} image viewer`}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        type="button"
                        className="gallery-lightbox__close"
                        aria-label="Close image viewer"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={26} />
                    </button>

                    <button
                        type="button"
                        className="gallery-lightbox__arrow gallery-lightbox__arrow--left"
                        aria-label="Previous image"
                        onClick={(event) => {
                            event.stopPropagation();
                            showPreviousImage();
                        }}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <div
                        className="gallery-lightbox__content"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img
                            src={validImages[selectedImage]}
                            alt={`${title} ${selectedImage + 1}`}
                        />

                        <span className="gallery-lightbox__counter">
                            {selectedImage + 1} / {validImages.length}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="gallery-lightbox__arrow gallery-lightbox__arrow--right"
                        aria-label="Next image"
                        onClick={(event) => {
                            event.stopPropagation();
                            showNextImage();
                        }}
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            )}
        </>
    );
}