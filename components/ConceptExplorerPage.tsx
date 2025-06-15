import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { Input, Button, Spinner, Alert, Text } from "@rewind-ui/core";
import ConceptInfo from "./ConceptInfo";
import ConceptGraph from "./ConceptGraph";
import RelatedWorks from "./RelatedWorks";

// Define the structure of a concept object (can be refined based on actual API response)
interface Concept {
  id: string;
  label: string;
  type: string;
  description?: string;
  alternativeLabels?: string[];
  relatedConcepts?: any; // Define more strictly if possible
  // Add other fields as needed from the API
}

const DEFAULT_CONCEPT_ID = "avkn7rq3"; // Default concept from original SPA

const ConceptExplorerPage: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>(DEFAULT_CONCEPT_ID);
  const [currentConceptId, setCurrentConceptId] = useState<string | null>(null);
  const [rootConceptData, setRootConceptData] = useState<Concept | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);


  const handleFetchConcept = useCallback(async (conceptIdToFetch: string) => {
    if (!conceptIdToFetch) {
      setError("Please enter a Concept ID.");
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    // Do not hide results immediately, allow components to show their own loading states
    // setShowResults(false);
    // If fetching the same concept, rootConceptData will already be there
    // but we might want to re-trigger graph/works if explicitly requested
    if (conceptIdToFetch === currentConceptId && rootConceptData) {
       // If it\'s already the current one, ensure input reflects it and components are visible
       setInputValue(conceptIdToFetch);
       setShowResults(true);
       setIsLoading(false); // Already loaded
       return;
    }


    try {
      const response = await fetch(`https://api.wellcomecollection.org/catalogue/v2/concepts/${conceptIdToFetch}`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Concept with ID "${conceptIdToFetch}" not found or API error: ${response.status}`);
      }
      const data: Concept = await response.json();
      setRootConceptData(data);
      setCurrentConceptId(data.id); // Ensure currentConceptId is set from the response
      setInputValue(data.id); // Update input field with the actual ID fetched
      setShowResults(true);
    } catch (err) {
      console.error("Error fetching concept:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setRootConceptData(null); // Clear data on error
      setCurrentConceptId(null);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentConceptId, rootConceptData]);

  // Initial load
  useEffect(() => {
    handleFetchConcept(DEFAULT_CONCEPT_ID);
  }, [handleFetchConcept]); // handleFetchConcept is memoized

  const handleExploreClick = () => {
    const idToExplore = inputValue.trim();
    if (idToExplore) {
      handleFetchConcept(idToExplore);
    } else {
      setError("Please enter a Concept ID.");
      setShowResults(false);
    }
  };

  const handleNodeClick = (newConceptId: string) => {
    setInputValue(newConceptId); // Update input field
    handleFetchConcept(newConceptId); // Fetch and display the new concept
  };

  return (
    <>
      <Head>
        <title>Wellcome Collection Concept Explorer</title>
        <meta name="description" content="Explore concepts from the Wellcome Collection" />
        {/* Add other meta tags as needed, e.g., viewport from original SPA */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="container mx-auto p-4 bg-gray-100 text-gray-800 min-h-screen">
        <header className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Wellcome Collection Concept Explorer
            </h1>
            <p className="text-sm text-gray-600">
              Enter a Concept ID or click on the graph to explore.
            </p>
          </div>
          {/* Search input and button moved here */}
          <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
            <Input
              id="conceptIdInput"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleExploreClick()}
              placeholder="e.g., avkn7rq3"
              className="flex-grow w-full min-w-0" // Adjusted styling
              // size="sm" // Example: Adjust size if needed
            />
            <Button
              id="fetchConceptBtn"
              onClick={handleExploreClick}
              disabled={isLoading}
              // color="blue" // Example: Adjust color if needed
              // size="sm" // Example: Adjust size if needed
              className="font-semibold" // Adjusted styling
            >
              {isLoading && !showResults ? "Exploring..." : "Explore"}
            </Button>
          </div>
        </header>

        {isLoading && !showResults && ( // Show main loading indicator only if no results are shown yet
          <div id="loading" className="text-center my-8 flex flex-col items-center justify-center">
            <Spinner size="lg" color="gray" />
            <Text className="mt-2 text-sm text-gray-600">
              Fetching concept data...
            </Text>
          </div>
        )}

        {error && !showResults && ( // Show main error only if no results are shown
          <Alert variant="danger" title="Error" id="error" className="my-8 text-sm">
            {error}
          </Alert>
        )}

        {/* Results Container - Conditionally rendered or managed internally by components */}
        {/* The `showResults` state ensures this section appears once an initial successful fetch happens */}
        {/* Individual components like ConceptGraph will have their own internal loading for subsequent updates */}
        <main id="results-container"
              className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${showResults ? "opacity-100" : "opacity-0 h-0 overflow-hidden"} transition-opacity duration-300 ease-in-out`}
        >
          {/* Left Column: Info and Graph */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* ConceptInfo will show its skeleton if rootConceptData is null but showResults is true (e.g. during graph click loading) */}
            <ConceptInfo concept={rootConceptData} />
            <ConceptGraph
                rootConcept={rootConceptData}
                onNodeClick={handleNodeClick}
                currentConceptId={currentConceptId}
            />
          </div>

          {/* Right Column: Related Works */}
          {/* RelatedWorks visibility is controlled by currentConceptId and its own internal loading state */}
          <div className="lg:col-span-1">
            <RelatedWorks conceptId={currentConceptId} isVisible={showResults && !!currentConceptId} />
          </div>
        </main>
      </div>
    </>
  );
};

export default ConceptExplorerPage;
