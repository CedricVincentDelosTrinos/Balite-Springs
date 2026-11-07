import type { BookDestination } from "../types";

interface DestinationPhotoPageProps {
  destination: BookDestination;
}

export default function DestinationPhotoPage({
  destination,
}: DestinationPhotoPageProps) {
  return (
    <section className="destination-photo">
      {destination.image ? (
        <img
          src={destination.image}
          alt={`${destination.name} resort`}
        />
      ) : (
        <div className="destination-photo-placeholder">
          <span>✦</span>
          <h1>{destination.name}</h1>
          <p>Photograph coming soon</p>
        </div>
      )}

      <div className="destination-photo-caption">
        <h2>{destination.name}</h2>
        <p>{destination.location}</p>
      </div>
    </section>
  );
}
