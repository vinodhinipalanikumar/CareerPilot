// src/components/career-guidance/CareerRecommendations.jsx
import CareerCard from "./CareerCard";

export default function CareerRecommendations({ results, onViewPath }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-1">Top Career Recommendations</h3>
      <p className="text-sm text-gray-500 mb-5">
        Ranked by how well your current skills, projects, and experience match each role.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((result) => (
          <CareerCard key={result.role.id} result={result} onViewPath={onViewPath} />
        ))}
      </div>
    </div>
  );
}
