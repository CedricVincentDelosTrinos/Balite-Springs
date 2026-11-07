
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Checking access...</div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
