import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook that provides navigation within the valorador flow.
 * Uses the client slug to create absolute paths like /fabian/detalles
 */
export function useValoradorNavigation() {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();

    const navigateTo = useCallback((path: string) => {
        // If path is empty, go to the client's root valorador page
        if (!path || path === '') {
            navigate(`/${slug}`);
            return;
        }
        // Navigate to /{slug}/{path}
        navigate(`/${slug}/${path}`);
    }, [navigate, slug]);

    const goBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return { navigateTo, goBack, slug };
}
