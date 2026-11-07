import type { BookDestination } from "../types";

interface DestinationInfoPageProps {
  destination: BookDestination;
}

export default function DestinationInfoPage({
  destination,
}: DestinationInfoPageProps) {
  return (
    <section className="destination-info">
      <header className="destination-info-header">
        <p className="destination-eyebrow">DISCOVER</p>

        <h1>{destination.name}</h1>

        <p className="destination-location">
          {destination.location}
        </p>

        <span className="destination-divider">❧</span>
      </header>

      <div className="destination-description">
        {destination.description.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
