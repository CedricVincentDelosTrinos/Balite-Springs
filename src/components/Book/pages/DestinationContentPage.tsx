interface DestinationContentPageProps {
    title: string;
    description: string[];
    destinationName: string;
}

export default function DestinationContentPage({
    title,
    description,
    destinationName,
}: DestinationContentPageProps) {
    return (
        <section className="destination-content-page">
            <div className="destination-content-heading">
                <span>{destinationName}</span>
                <h1>{title}</h1>
                <div className="destination-content-divider">❧</div>
            </div>

            <div className="destination-content-body">
                {description.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        </section>
    );
}