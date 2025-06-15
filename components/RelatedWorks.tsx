import React, { useState, useEffect } from "react";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '2em',
    marginBottom: '2em',
    minHeight: 200,
  },
  h2: {
    fontSize: '1.2em',
    fontWeight: 700,
    marginBottom: '1em',
  },
  worksList: {
    maxHeight: '60vh',
    overflowY: 'auto' as const,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1em',
  },
  workCard: {
    background: '#f3f4f6',
    borderRadius: 10,
    padding: '1em',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    minHeight: 80,
  },
  workTitle: {
    fontWeight: 600,
    fontSize: '1em',
    color: '#222',
    marginTop: 8,
  },
  img: {
    width: 60,
    height: 60,
    objectFit: 'cover' as const,
    borderRadius: 8,
    background: '#e5e7eb',
  },
  error: {
    background: '#ffeaea',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    padding: '1em',
    borderRadius: 8,
    marginBottom: 8,
  },
};

interface Work {
  id: string;
  title: string;
  description?: string;
  thumbnail?: {
    url: string;
  };
  contributors?: Array<{
    agent: { label: string };
    roles?: string[];
  }>;
}

interface WorksResponse {
  results: Work[];
}

interface RelatedWorksProps {
  conceptId: string | null;
  isVisible: boolean;
}

const RelatedWorks: React.FC<RelatedWorksProps> = ({ conceptId, isVisible }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conceptId || !isVisible) {
      setWorks([]);
      return;
    }
    const fetchWorksData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.wellcomecollection.org/catalogue/v2/works?subjects=${conceptId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch works: ${response.status}`);
        }
        const data: WorksResponse = await response.json();
        setWorks(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setWorks([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorksData();
  }, [conceptId, isVisible]);

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div style={styles.card}>
        <div style={styles.h2}>Related Works</div>
        <div>Loading...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ ...styles.card, ...styles.error }}>
        <div style={styles.h2}>Related Works</div>
        <div>Error loading works: {error}</div>
      </div>
    );
  }
  return (
    <div style={styles.card}>
      <div style={styles.h2}>Related Works</div>
      <div style={styles.worksList}>
        {works.length > 0 ? (
          works.map(work => (
            <a
              key={work.id}
              href={`https://wellcomecollection.org/works/${work.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.workCard}
            >
              <img
                src={work.thumbnail?.url || 'https://placehold.co/60x60/e2e8f0/94a3b8?text=No+Image'}
                alt={work.title}
                style={styles.img}
              />
              <div style={styles.workTitle}>{work.title}</div>
              {work.description && (
                <div style={{ color: '#444', fontSize: '0.97em', margin: '6px 0 0 0' }}>{work.description}</div>
              )}
              {work.contributors && work.contributors.length > 0 && (
                <div style={{ color: '#666', fontSize: '0.93em', marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>Author:</span> {work.contributors.map(c => c.agent.label).join(', ')}
                </div>
              )}
            </a>
          ))
        ) : (
          <div style={{ color: '#888', fontSize: '0.95em', padding: 8 }}>No related works found.</div>
        )}
      </div>
    </div>
  );
};

export default RelatedWorks;
