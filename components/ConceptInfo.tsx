import React from "react";

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
      <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="space-y-1 text-xs">
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="conceptInfo" className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2 text-gray-900">{concept.label}</h2>
      <p className="text-sm text-gray-700 mb-3">
        {concept.description || "No description available."}
      </p>
      <div className="text-xs space-y-1 text-gray-600">
        <p>
          <strong>ID:</strong>{" "}
          <span className="font-mono bg-gray-100 px-1 rounded">
            {concept.id}
          </span>
        </p>
        <p>
          <strong>Type:</strong> {concept.type}
        </p>
        {concept.alternativeLabels && concept.alternativeLabels.length > 0 && (
          <p>
            <strong>Alt Labels:</strong> {concept.alternativeLabels.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConceptInfo;
