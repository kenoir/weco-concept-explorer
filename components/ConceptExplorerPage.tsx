import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/router";
import ConceptInfo from "./ConceptInfo";
import ConceptGraph from "./ConceptGraph";
import RelatedWorks from "./RelatedWorks";

const DEFAULT_CONCEPT_ID = "avkn7rq3";

const styles = {
  container: {
    maxWidth: '100vw',
    width: '100vw',
    margin: 0,
    padding: '2em',
    fontFamily: 'Arial, Helvetica, sans-serif',
    background: '#f7f7fa',
    color: '#222',
    boxSizing: 'border-box' as const,
  },
  h1: {
    fontSize: '2.5em',
    fontWeight: 800,
    marginBottom: '0.2em',
  },
  p: {
    color: '#555',
    marginBottom: '2em',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '2em',
    marginBottom: '2em',
  },
  error: {
    background: '#ffeaea',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2em',
    width: '100%',
  },
  gridCol: {
    width: '100%',
  },
};

const ConceptExplorerPage: React.FC = () => {
  const router = useRouter();
  const [currentConceptId, setCurrentConceptId] = useState<string | null>(null);
  const [rootConceptData, setRootConceptData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load concept ID from URL
  useEffect(() => {
    if (!router.isReady) return;
    const conceptId = typeof router.query.id === 'string' ? router.query.id : DEFAULT_CONCEPT_ID;
    setCurrentConceptId(conceptId);
  }, [router.isReady, router.query.id]);

  // Fetch concept data when currentConceptId changes
  useEffect(() => {
    if (!currentConceptId) return;
    setIsLoading(true);
    setError(null);
    fetch(`https://api.wellcomecollection.org/catalogue/v2/concepts/${currentConceptId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Concept with ID "${currentConceptId}" not found or API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRootConceptData(data);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setRootConceptData(null);
      })
      .finally(() => setIsLoading(false));
  }, [currentConceptId]);

  // When a node is clicked, update the URL and state
  const handleNodeClick = useCallback((newConceptId: string) => {
    router.push({ pathname: router.pathname, query: { id: newConceptId } }, undefined, { shallow: true });
    setCurrentConceptId(newConceptId);
  }, [router]);

  return (
    <div style={styles.container}>
      {/* Removed H1 title */}
      {error && (
        <div style={{ ...styles.card, ...styles.error }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {rootConceptData && (
        <div style={styles.card}>
          <ConceptInfo concept={rootConceptData} />
        </div>
      )}
      <div style={styles.card}>
        <ConceptGraph
          rootConcept={rootConceptData}
          onNodeClick={handleNodeClick}
          currentConceptId={currentConceptId}
        />
      </div>
      <div style={{ ...styles.card, marginTop: 24 }}>
        <RelatedWorks conceptId={currentConceptId} isVisible={!!currentConceptId} />
      </div>
    </div>
  );
};

export default ConceptExplorerPage;
