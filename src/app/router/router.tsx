
import { createBrowserRouter } from "react-router-dom";

import Layout from "../../components/layout/Layout";
import AdminLayout from "../../components/Admin/AdminLayout";

import HomePage from "../../pages/Home/HomePage";
import ErrorPage from "../../pages/ErrorPage/ErrorPage";
import LoginPage from "../../pages/Admin/LoginPage";
import AdminHome from "../../pages/Admin/AdminHome";
import DestinationsPage from "../../pages/Admin/DestinationsPage";
import PagesPage from "../../pages/Admin/PagesPage";
import FeedbackPage from "../../pages/Feedback/FeedbackPage";
import FeedbackAdminPage from "../../pages/Admin/FeedbackPage";
import CarouselPage from "../../pages/Admin/CarouselPage";

import ProtectedRoute from "../../auth/ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "feedback",
                element: <FeedbackPage />,
            },
        ],
    },
    {
        path: "/admin/login",
        element: <LoginPage />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/admin",
                element: <AdminLayout />,
                children: [
                    {
                        index: true,
                        element: <AdminHome />,
                    },
                    {
                        path: "destinations",
                        element: <DestinationsPage />,
                    },
                    {
                        path: "pages",
                        element: <PagesPage />,
                    },
                    {
                        path: "carousel",
                        element: <CarouselPage />,
                    },
                    { 
                        path: "feedback", 
                        element: <FeedbackAdminPage /> 
                    },
                ],
            },
        ],
    },
]);
