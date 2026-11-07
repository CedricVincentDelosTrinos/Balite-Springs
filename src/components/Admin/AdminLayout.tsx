
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    MapPin,
    FileText,
    Images,
    MessageSquare,
    LogOut,
    BookOpen,
} from "lucide-react";


import { useAuth } from "../../auth/AuthContext";
import "./Admin.css";

const navigation = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    { label: "Destinations", path: "/admin/destinations", icon: MapPin },
    { label: "Pages", path: "/admin/pages", icon: FileText },
    { label: "Carousel", path: "/admin/carousel", icon: Images },
    { label: "Feedback", path: "/admin/feedback", icon: MessageSquare },
];

export default function AdminLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    async function handleSignOut() {
        await signOut();
        navigate("/admin/login");
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span className="admin-brand-icon">✦</span>
                    <div>
                        <h2>Balite Springs</h2>
                        <span>Content Management</span>
                    </div>
                </div>

                <nav className="admin-nav">
                    <p className="admin-nav-label">WORKSPACE</p>

                    {navigation.map(({ label, path, icon: Icon, end }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={end}
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <a href="/" className="admin-back-to-book">
                        <BookOpen size={17} />
                        Back to Book
                    </a>
                    <span className="admin-user-email">{user?.email}</span>
                    <button onClick={handleSignOut} className="admin-logout">
                        <LogOut size={17} />
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}
