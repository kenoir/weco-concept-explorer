import React from "react";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '2em',
    marginBottom: '2em',
  },
  h2: {
    fontSize: '1.5em',
    fontWeight: 700,
    marginBottom: '0.5em',
  },
  desc: {
    color: '#444',
    marginBottom: '1em',
  },
  badge: {
    display: 'inline-block',
    background: '#e0e7ff',
    color: '#3730a3',
    borderRadius: 8,
    padding: '0.1em 0.6em',
    fontSize: '0.9em',
    marginLeft: 6,
    fontWeight: 600,
  },
  alt: {
    color: '#666',
    fontSize: '0.95em',
    marginTop: 4,
  },
  label: {
    fontWeight: 600,
    marginRight: 4,
  },
};

// Define the expected structure of a concept object
interface Concept {
  id: string;
  label: string;
  type: string;
  description?: string;
  alternativeLabels?: string[];
}

interface ConceptInfoProps {
  concept: Concept | null;
}

const ConceptInfo: React.FC<ConceptInfoProps> = ({ concept }) => {
  if (!concept) {
    return (
      <div style={styles.card}>
        <div style={{ height: 24, background: '#eee', borderRadius: 6, width: '60%', marginBottom: 12 }} />
        <div style={{ height: 16, background: '#eee', borderRadius: 6, width: '90%', marginBottom: 8 }} />
        <div style={{ height: 16, background: '#eee', borderRadius: 6, width: '70%', marginBottom: 8 }} />
        <div style={{ height: 12, background: '#eee', borderRadius: 6, width: '40%' }} />
      </div>
    );
  }
  return (
    <div style={styles.card}>
      <div style={styles.h2}>{concept.label}</div>
      <div style={styles.desc}>{concept.description || "No description available."}</div>
      <div style={{ marginBottom: 6 }}>
        <span style={styles.label}>ID:</span>
        <span style={styles.badge}>{concept.id}</span>
      </div>
      <div style={{ marginBottom: 6 }}>
        <span style={styles.label}>Type:</span>
        <span style={{ ...styles.badge, background: '#dbeafe', color: '#2563eb' }}>{concept.type}</span>
      </div>
      {concept.alternativeLabels && concept.alternativeLabels.length > 0 && (
        <div style={styles.alt}>
          <span style={styles.label}>Alt Labels:</span>
          {concept.alternativeLabels.join(", ")}
        </div>
      )}
    </div>
  );
};

export default ConceptInfo;
