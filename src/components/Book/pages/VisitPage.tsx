import { MapPin, ExternalLink } from "lucide-react";
import type {
    CMSDestination,
    BookSettingsContent,
} from "../types";

interface VisitPageProps {
    destinations: CMSDestination[];
    content: BookSettingsContent;
}

export default function VisitPage({
    destinations,
    content,
}: VisitPageProps) {
    return (
        <section className="visit-page-content">
            <header className="visit-header">
                <h1>{content.title}</h1>
                <p>{content.description}</p>
            </header>

            <div className="visit-locations">
                {destinations.map((destination) => (
                    <article className="visit-location" key={destination.id}>
                        <div className="visit-location-details">
                            <MapPin size={20} />
                            <div>
                                <h2>{destination.name}</h2>
                                <p>{destination.location}</p>
                            </div>
                        </div>

                        {destination.maps_url && (
                            <a
                                className="visit-map-button"
                                href={destination.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {content.button_label}
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}