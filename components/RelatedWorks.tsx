import React, { useState, useEffect } from "react";
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
        const response = await fetch(`/api/wellcome/works?subjects=${conceptId}`);
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
      <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Related Works</h2>
        <div className={`${styles.worksList} h-[82vh] overflow-y-auto pr-2 grid grid-cols-2 gap-3`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-md overflow-hidden shadow-sm animate-pulse">
              <div className={`w-full h-0 ${styles.workCard}`} style={{ paddingBottom: "100%", backgroundColor: "#e2e8f0" }}></div>
              <div className="p-2">
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Related Works</h2>
        <p className="text-red-500">Error loading works: {error}</p>
      </div>
    );
  }

  return (
    <div id="relatedWorks" className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Related Works</h2>
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
                className={`${styles.workCard} group relative block bg-gray-50 rounded-md overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
              >
                <img
                  src={imageUrl}
                  alt={`Thumbnail for ${work.title}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src="https://placehold.co/300x300/e2e8f0/94a3b8?text=Error";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <h3 className="font-semibold text-xs text-white leading-tight drop-shadow-sm">
                    {work.title}
                  </h3>
                </div>
              </a>
            );
          })
        ) : (
          <p className="text-gray-500 p-4 text-sm col-span-full">No related works found.</p>
        )}
      </div>
    </div>
  );
};

export default RelatedWorks;
