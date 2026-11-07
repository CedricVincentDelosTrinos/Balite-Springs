
import { Link } from "react-router-dom";
import { MapPin, FileText, MessageSquare, Images } from "lucide-react";

const sections = [
    {
        title: "Destinations",
        description: "Manage the spring destinations and their details.",
        path: "/admin/destinations",
        icon: MapPin,
    },
    {
        title: "Pages",
        description: "Create and organize destination information pages.",
        path: "/admin/pages",
        icon: FileText,
    },
    {
        title: "Carousel",
        description: "Manage the images displayed beside the digital book.",
        path: "/admin/carousel",
        icon: Images,
    },
    {
        title: "Feedback",
        description: "Review and manage visitor feedback.",
        path: "/admin/feedback",
        icon: MessageSquare,
    },
];

export default function AdminHome() {
    return (
        <div className="admin-content">
            <header className="admin-page-header">
                <div>
                    <p className="admin-eyebrow">WORKSPACE</p>
                    <h1>Dashboard</h1>
                    <p>Manage your Balite Springs brochure content.</p>
                </div>
            </header>

            <section className="admin-section-grid">
                {sections.map(({ title, description, path, icon: Icon }) => (
                    <Link to={path} className="admin-section-card" key={title}>
                        <div className="admin-card-icon">
                            <Icon size={22} />
                        </div>
                        <h2>{title}</h2>
                        <p>{description}</p>
                        <span>Manage section →</span>
                    </Link>
                ))}
            </section>
        </div>
    );
}
