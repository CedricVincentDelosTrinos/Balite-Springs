import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function LoginPage() {
    const { user, isAdmin, loading, signIn } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const from = location.state?.from?.pathname || "/admin";

    if (loading) {
        return <div>Checking session...</div>;
    }

    if (user && isAdmin) {
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        const message = await signIn(email, password);

        if (message) {
            setError(message);
        }

        setSubmitting(false);
    }

    return (
        <main className="admin-login">
            <h1>Admin Login</h1>
            <p>Sign in to manage Balite Springs.</p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    required
                />

                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <p role="alert">{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? "Signing in..." : "Sign In"}
                </button>
            </form>

            <Link to="/">Back to brochure</Link>
        </main>
    );
}
