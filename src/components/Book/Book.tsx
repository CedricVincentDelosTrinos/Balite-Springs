import {
    useRef,
    useState,
    useEffect,
    type ComponentRef,
} from "react";


import { supabase } from "../../lib/supabase";

import { Link } from "react-router-dom";


import CMSBookPage from "./CMSBookPage";

import VisitPage from "./pages/VisitPage";

import coverTree from "../../assets/images/decorations/covertree.png";
import GalleryCarousel from "./GalleryCarousel";

import HTMLFlipBook from "react-pageflip";
import {
    ChevronLeft,
    ChevronRight,
    MessageSquareText,
    Settings,
} from "lucide-react";

import BookPage from "./BookPage";
import "./Book.css";


interface CMSDestination {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    maps_url: string | null;
    image_url: string | null;
}

interface CMSPage {
    id: string;
    destination_id: string | null;
    title: string;
    slug: string;
    page_type: "text" | "image" | "video" | "gallery";
    content: {
        description?: string[];
        image_url?: string;
        alt?: string;
        caption?: string;

        overlay_enabled?: boolean;
        overlay_url?: string;
        overlay_opacity?: number;
        overlay_scale?: number;
        overlay_position_x?: number;
        overlay_position_y?: number;

        video_url?: string;
        images?: {
            url: string;
            alt: string;
            caption: string;
        }[];
    };
    display_order: number;
    is_published: boolean;
}

interface BookSettingsContent {
    title: string;
    description: string;
    button_label: string;
}

interface CMSContent {
    destinations: CMSDestination[];
    pages: CMSPage[];
    backCoverContent: BookSettingsContent;
    carouselImages: string[];
}


export default function Book() {
    const bookRef = useRef<ComponentRef<typeof HTMLFlipBook>>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(0);

    const [cmsContent, setCmsContent] = useState<CMSContent | null>(null);

    const [dimensions, setDimensions] = useState({
        width: 400,
        height: 560,
        isMobile: false,
    });

    const [dimensionsReady, setDimensionsReady] = useState(false);

    // Load published CMS content from Supabase.
    useEffect(() => {
        async function loadCMSContent() {
            const [
                destinationResult,
                pageResult,
                settingsResult,
                carouselResult,
            ] = await Promise.all([
                supabase
                    .from("destinations")
                    .select("id, slug, name, location, maps_url, image_url")
                    .order("name"),

                supabase
                    .from("pages")
                    .select(
                        "id, destination_id, title, slug, page_type, content, display_order, is_published"
                    )
                    .eq("is_published", true)
                    .order("display_order"),

                supabase
                    .from("book_settings")
                    .select("back_cover_content")
                    .eq("id", true)
                    .maybeSingle(),

                supabase
                    .from("gallery_carousel_images")
                    .select("image_url")
                    .order("display_order", { ascending: true }),
            ]);

            if (destinationResult.error || pageResult.error) {
                console.error(
                    "Failed to load brochure content:",
                    destinationResult.error ?? pageResult.error
                );

                setCmsContent({
                    destinations: destinationResult.data ?? [],
                    carouselImages: carouselResult.data?.map((image) => image.image_url) ?? [],
                    pages: pageResult.data ?? [],
                    backCoverContent: settingsResult.data?.back_cover_content ?? {
                        title: "Visit Us",
                        description: "Discover our destinations and plan your next getaway.",
                        button_label: "Get Directions",
                    },
                });

                return;
            }

            setCmsContent({
                destinations: destinationResult.data ?? [],
                carouselImages: carouselResult.data?.map((image) => image.image_url) ?? [],
                pages: pageResult.data ?? [],
                backCoverContent: settingsResult.data?.back_cover_content ?? {
                    title: "Visit Us",
                    description: "Discover our destinations and plan your next getaway.",
                    button_label: "Get Directions",
                },
            });
        }

        loadCMSContent();
    }, []);

    // Calculate responsive book dimensions.
    useEffect(() => {
        const stage = stageRef.current;

        if (!stage) return;


        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            const isMobile = window.matchMedia("(max-width: 700px)").matches;

            const availableWidth = isMobile ? width : width / 2;
            const aspectRatio = 400 / 560;

            const pageWidth = Math.min(
                availableWidth,
                height * aspectRatio
            );

            const pageHeight = pageWidth / aspectRatio;

            setDimensions({
                width: Math.floor(pageWidth),
                height: Math.floor(pageHeight),
                isMobile,
            });
            setDimensionsReady(true);

        });

        observer.observe(stage);

        return () => observer.disconnect();
    }, [cmsContent]);


    useEffect(() => {
        if (cmsContent !== null) {
            console.log("CMS Destinations:", cmsContent.destinations);
            console.log("CMS Pages:", cmsContent.pages);
            const imagePage = cmsContent.pages.find(
                (page) => page.slug === "balite-image"
            );

            console.log("Image page content:", imagePage?.content);
        }
    }, [cmsContent]);

    const previousPage = () => {
        console.log("PREVIOUS CLICKED");
        console.log("Current page:", currentPage);
        console.log("Flipbook instance:", bookRef.current?.pageFlip());

        bookRef.current?.pageFlip().flipPrev();
    };

    const nextPage = () => {
        bookRef.current?.pageFlip().flipNext();
    };


    if (cmsContent === null) {
        return <main className="book-container">Loading brochure...</main>;
    }

    const needsSpacer = cmsContent.pages.length % 2 !== 0;

    const visitPageIndex =
        cmsContent.pages.length + 1 + (needsSpacer ? 1 : 0);
    console.log("Published CMS page count:", cmsContent.pages.length);
    console.log("Needs spacer:", needsSpacer);
    console.log("Visit page index:", visitPageIndex);
    console.table(
        cmsContent.pages.map((page, index) => ({
            index: index + 1,
            title: page.title,
            slug: page.slug,
            type: page.page_type,
        }))
    );

    return (
        
        <main className="book-container">
            {/* Utility navigation */}
            <div className="book-utility-navigation">
                <Link to="/feedback" className="book-utility-button">
                    <MessageSquareText size={17} />
                    <span>Share Feedback</span>
                </Link>

                <Link to="/admin/login" className="book-utility-button">
                    <Settings size={17} />
                    <span>Admin</span>
                </Link>
            </div>
            <div
                className={`book-stage ${currentPage === visitPageIndex ? "is-back-cover" : ""}`}
                ref={stageRef}
            >
                {/* Background decorations */}
                <div className="book-background">
                    <div
                        className={`background-decoration cover-background ${currentPage === 0 ? "visible" : ""
                            }`}
                    >
                        <img className="covertree" src={coverTree} alt="" />
                    </div>

                </div>

                {currentPage === visitPageIndex && (
                    <GalleryCarousel
                        images={cmsContent.carouselImages}
                        title="Balite Springs gallery"
                    />
                )}

                {/* Previous page button */}
                <button
                    className="book-arrow book-arrow-prev"
                    onClick={() => {
                        alert("Previous button tapped!");
                        previousPage();
                    }}
                    disabled={currentPage === 0}
                    aria-label="Previous page"
                >
                    <ChevronLeft />
                </button>

                {/* Flipbook */}
                {dimensionsReady && (
                    <HTMLFlipBook
                        ref={bookRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        size="fixed"
                        minWidth={200}
                        maxWidth={800}
                        minHeight={280}
                        maxHeight={1120}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={1000}
                        usePortrait={dimensions.isMobile}
                        startZIndex={0}
                        autoSize={false}
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={false}
                        disableFlipByClick={true}
                        className="balite-book"
                        style={{}}
                        onFlip={(event) => setCurrentPage(event.data)}
                    >
                        {/* Front cover */}
                        <BookPage className="cover">
                            <div className="cover-decoration">
                                <span>✦</span>
                            </div>

                            <div className="cover-title">
                                <p>A NATURAL ESCAPE</p>
                                <h1>Balite<br />Springs</h1>
                                <span className="cover-divider">❧</span>
                                <p>YOUR LITTLE ESCAPE INTO NATURE</p>
                            </div>
                        </BookPage>

                        {/* Dynamic CMS pages */}
                        {cmsContent.pages.map((page) => (
                            <BookPage key={page.id}>
                                <CMSBookPage page={page} />
                            </BookPage>
                        ))}

                        {/* Automatic blank spacer for odd CMS page counts */}
                        {needsSpacer ? (
                            <BookPage
                                key="back-cover-spacer"
                                className="back-cover-spacer"
                            >
                                <div aria-hidden="true" />
                            </BookPage>
                        ) : []}

                        {/* Visit Us / Back cover */}
                        <BookPage className="visit-page">
                            <VisitPage
                                destinations={cmsContent.destinations}
                                content={cmsContent.backCoverContent}
                            />
                        </BookPage>
                    </HTMLFlipBook>
                )}

                {/* Next page button */}
                <button
                    className="book-arrow book-arrow-next"
                    onClick={nextPage}
                    disabled={currentPage >= visitPageIndex}
                    aria-label="Next page"
                >
                    <ChevronRight />
                </button>
            </div>
        </main>
    );

}