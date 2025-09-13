import { useEffect } from 'react';

interface AnalyzeRedirectProps {
    navigate: (path: string) => void;
}

const AnalyzeRedirect: React.FC<AnalyzeRedirectProps> = ({ navigate }) => {
    useEffect(() => {
        // Extract query parameter and redirect to home with the same query
        const queryParam = new URLSearchParams(window.location.search).get('q') || '';
        const redirectPath = queryParam ? `/?q=${encodeURIComponent(queryParam)}` : '/';
        navigate(redirectPath);
    }, [navigate]);

    return (
        <div className="app-container">
            <div className="card">
                <div>Redirecting to dashboard...</div>
            </div>
        </div>
    );
};

export default AnalyzeRedirect;