import React from "react";
import { Card, Text, Badge } from "@rewind-ui/core"; // Removed Skeleton

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
      <Card className="animate-pulse"> {/* Added animate-pulse to the Card itself */}
        <Card.Header>
          {/* Original skeleton structure for header */}
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        </Card.Header>
        <Card.Body>
          {/* Original skeleton structure for body */}
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
          <div className="space-y-1 text-xs">
            <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/3"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card id="conceptInfo">
      <Card.Header>
        <Text variant="h2" weight="bold" className="text-gray-900">
          {concept.label}
        </Text>
      </Card.Header>
      <Card.Body>
        <Text className="text-gray-700 mb-3">
          {concept.description || "No description available."}
        </Text>
        <div className="space-y-1">
          <Text size="xs" className="text-gray-600">
            <strong>ID:</strong>{" "}
            <Badge color="gray" size="sm" className="font-mono">
              {concept.id}
            </Badge>
          </Text>
          <Text size="xs" className="text-gray-600">
            <strong>Type:</strong> <Badge color="blue" size="sm">{concept.type}</Badge>
          </Text>
          {concept.alternativeLabels && concept.alternativeLabels.length > 0 && (
            <Text size="xs" className="text-gray-600">
              <strong>Alt Labels:</strong> {concept.alternativeLabels.join(", ")}
            </Text>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConceptInfo;
