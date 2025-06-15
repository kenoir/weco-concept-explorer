import React, { useState, useEffect } from "react";
import { Card, Alert, Text } from "@rewind-ui/core"; // Removed Skeleton
import styles from "./RelatedWorks.module.css"; // Import CSS Modules

interface Work {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
  };
}

interface WorksResponse {
  results: Work[];
}

interface RelatedWorksProps {
  conceptId: string | null;
  isVisible: boolean; // To control fetching and rendering
}

const RelatedWorks: React.FC<RelatedWorksProps> = ({ conceptId, isVisible }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId || !isVisible) {
      setWorks([]); // Clear works if no conceptId or not visible
      return;
    }

    const fetchWorksData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use `subjects` as the query parameter for the API proxy
        const response = await fetch(`https://api.wellcomecollection.org/catalogue/v2/works?subjects=${conceptId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch works: ${response.status}`);
        }
        const data: WorksResponse = await response.json();
        setWorks(data.results || []);
      } catch (err) {
        console.error("Error fetching related works:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setWorks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorksData();
  }, [conceptId, isVisible]);

  if (!isVisible) {
    return null; // Don\'t render anything if not visible
  }

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <Text variant="h2" weight="bold" className="text-gray-900">Related Works</Text>
        </Card.Header>
        <Card.Body>
          {/* Original skeleton structure for related works list */}
          <div className={`${styles.worksList} h-[82vh] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-50 rounded-md overflow-hidden shadow-sm animate-pulse">
                <div className={`w-full h-0 ${styles.workCard}`} style={{ paddingBottom: "100%", backgroundColor: "#e2e8f0" }}></div>
                <div className="p-2">
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Header>
          <Text variant="h2" weight="bold" className="text-gray-900">Related Works</Text>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" title="Error">
            Error loading works: {error}
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card id="relatedWorks">
      <Card.Header>
        <Text variant="h2" weight="bold" className="text-gray-900">Related Works</Text>
      </Card.Header>
      <Card.Body>
        <div id="worksList" className={`${styles.worksList} h-[82vh] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-3`}>
          {works.length > 0 ? (
            works.map(work => {
              const imageUrl = work.thumbnail?.url || `https://placehold.co/300x300/e2e8f0/94a3b8?text=No+Image`;
              return (
                <a
                  key={work.id}
                  href={`https://wellcomecollection.org/works/${work.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                >
                  <Card className={`${styles.workCard} group relative overflow-hidden h-full flex flex-col`}>
                    <Card.Image
                      src={imageUrl}
                      alt={`Thumbnail for ${work.title}`}
                      className="w-full h-auto object-cover aspect-square flex-shrink-0" // Added flex-shrink-0 and ensured other styles are appropriate for Card.Image
                      // The onError handler might need to be re-evaluated if Card.Image doesn't support it directly.
                      // For now, assuming it might be handled internally or props are passed through.
                      // If not, a wrapper component or a different approach for error handling might be needed.
                    />
                    <Card.Body className="flex-grow p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent absolute bottom-0 left-0 right-0">
                      <Text weight="semiBold" size="xs" className="text-white leading-tight drop-shadow-sm">
                        {work.title}
                      </Text>
                    </Card.Body>
                  </Card>
                </a>
              );
            })
          ) : (
            <Text className="text-gray-500 p-4 text-sm col-span-full">No related works found.</Text>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default RelatedWorks;
