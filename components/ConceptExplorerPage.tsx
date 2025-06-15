import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
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
          <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              id="conceptIdInput"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleExploreClick()}
              className="flex-grow w-full min-w-0 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., avkn7rq3"
            />
            <button
              id="fetchConceptBtn"
              onClick={handleExploreClick}
              disabled={isLoading}
              className="bg-blue-600 text-white font-semibold px-4 py-1.5 text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50"
            >
              {isLoading && !showResults ? "Exploring..." : "Explore"}
            </button>
          </div>
        </header>

        {isLoading && !showResults && ( // Show main loading indicator only if no results are shown yet
          <div id="loading" className="text-center my-8">
            <svg
              className="animate-spin h-6 w-6 text-blue-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Fetching concept data...
            </p>
          </div>
        )}

        {error && !showResults && ( // Show main error only if no results are shown
             <div id="error" className="text-center my-8 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
             </div>
        )}

        {/* Results Container - Conditionally rendered or managed internally by components */}
        {/* The `showResults` state ensures this section appears once an initial successful fetch happens */}
        {/* Individual components like ConceptGraph will have their own internal loading for subsequent updates */}
        <main id="results-container"
              className={`grid grid-cols-1 lg:grid-cols-5 gap-4 ${showResults ? "opacity-100" : "opacity-0 h-0 overflow-hidden"} transition-opacity duration-300 ease-in-out`}
        >
          {/* Left Column: Info and Graph */}
          <div className="lg:col-span-3 flex flex-col gap-4">
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
          <RelatedWorks conceptId={currentConceptId} isVisible={showResults && !!currentConceptId} />
        </main>
      </div>
    </>
  );
};

export default ConceptExplorerPage;
