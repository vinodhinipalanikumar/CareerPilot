// FormElements.jsx
// Shared, reusable UI pieces for the Resume Builder.
// Every section (Education, Projects, Skills, ...) reuses these
// instead of each getting its own component file.

import { MONTHS, YEARS } from "../../data/resumeFormConfig";

// --- Collapsible wrapper used for every section ---
export function AccordionSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-xl mb-4 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4
                   text-left font-semibold text-gray-800 hover:bg-blue-50
                   transition-colors"
      >
        <span>{title}</span>
        {/* Rotate the chevron based on open state instead of swapping icons */}
        <span
          className={`text-blue-600 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Smooth expand/collapse: animate max-height instead of
          conditionally rendering, so it transitions instead of snapping. */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

// --- Generic field renderer: reads a field's `type` from config
//     and renders the right input, instead of one component per field type. ---
export function FieldRenderer({ field, value, onChange, error }) {
  const baseInput =
    "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 " +
    (error
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:ring-blue-200 focus:border-blue-400");

  if (field.type === "monthYearRange") {
    return (
      <MonthYearRangeField field={field} value={value} onChange={onChange} />
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === "textarea" && (
        <textarea
          rows={3}
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "select" && (
        <select
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === "checkbox" && (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
      )}

      {field.type === "file" && (
        <input
          type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name || "")}
          className="text-sm"
        />
      )}

      {["text", "email", "tel", "url", "date"].includes(field.type) && (
        <input
          type={field.type}
          className={baseInput}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// --- Start/End Month+Year picker, optionally with a "Currently..." checkbox ---
function MonthYearRangeField({ field, value = {}, onChange }) {
  const startLabel = field.startLabel || "Start";
  const endLabel = field.endLabel || "End";

  const update = (key, val) => onChange({ ...value, [key]: val });

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select className="border rounded-lg px-2 py-2 text-sm"
          value={value.startMonth || ""} onChange={(e) => update("startMonth", e.target.value)}>
          <option value="">{startLabel} Month</option>
          {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="border rounded-lg px-2 py-2 text-sm"
          value={value.startYear || ""} onChange={(e) => update("startYear", e.target.value)}>
          <option value="">{startLabel} Year</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {!value.current && (
          <>
            <select className="border rounded-lg px-2 py-2 text-sm"
              value={value.endMonth || ""} onChange={(e) => update("endMonth", e.target.value)}>
              <option value="">{endLabel} Month</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="border rounded-lg px-2 py-2 text-sm"
              value={value.endYear || ""} onChange={(e) => update("endYear", e.target.value)}>
              <option value="">{endLabel} Year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
      </div>

      {field.currentLabel && (
        <label className="inline-flex items-center gap-2 mt-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={!!value.current}
            onChange={(e) => update("current", e.target.checked)}
            className="accent-blue-600"
          />
          {field.currentLabel}
        </label>
      )}
    </div>
  );
}