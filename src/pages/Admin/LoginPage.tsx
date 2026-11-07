
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

import "./LoginPage.css";

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

        try {
            const message = await signIn(email, password);

            if (message) {
                setError(message);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="admin-login">
            <div className="admin-login__card">
                <header className="admin-login__header">
                    <div className="admin-login__brand">
                        Balite Springs
                    </div>

                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your digital brochure.</p>
                </header>

                <form
                    className="admin-login__form"
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && (
                        <p className="admin-login__error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="admin-login__submit"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <Link className="admin-login__back" to="/">
                    ← Back to brochure
                </Link>
            </div>
        </main>
    );
}
