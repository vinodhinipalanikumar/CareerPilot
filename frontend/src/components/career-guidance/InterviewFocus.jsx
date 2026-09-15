// src/components/career-guidance/InterviewFocus.jsx
function Group({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <ul className="space-y-1.5 list-disc list-inside">
        {items.map((item) => (
          <li key={item} className="text-sm text-gray-600">{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function InterviewFocus({ interviewTopics }) {
  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-5">Interview Focus</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Group title="Technical" items={interviewTopics.technical} />
        <Group title="Coding" items={interviewTopics.coding} />
        <Group title="Project Questions" items={interviewTopics.projectQuestions} />
        <Group title="HR" items={interviewTopics.hr} />
      </div>
    </div>
  );
}
