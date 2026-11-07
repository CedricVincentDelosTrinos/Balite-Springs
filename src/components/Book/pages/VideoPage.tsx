export default function VideoPage() {
  return (
    <section className="video-page-content">
      <header className="destination-info-header">
        <p className="destination-eyebrow">A GLIMPSE OF NATURE</p>
        <h1>Experience Balite Springs</h1>
        <span className="destination-divider">❧</span>
      </header>

      <div className="video-container">
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F4118989941670811%2F&show_text=false&width=267&t=0"
          title="Balite Springs Video"
          frameBorder="0"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}