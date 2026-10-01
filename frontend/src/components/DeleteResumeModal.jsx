// DeleteResumeModal.jsx
//
// Replaces the native window.confirm() previously used in Dashboard.jsx for
// deleting a saved resume (PROBLEM 3: "localhost says..." popup). A native
// confirm() cannot be styled, cannot show the actual resume title cleanly,
// and blocks the whole page/thread — this is a normal React modal instead.
//
// Deliberately dumb/presentational: Dashboard.jsx owns the actual delete
// API call, loading state, and success/error messaging, so this component
// only renders the confirmation UI and calls back.
import { AlertTriangle, X } from "lucide-react";

export default function DeleteResumeModal({ resumeTitle, isDeleting, errorMessage, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-resume-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <h2 id="delete-resume-title" className="text-lg font-bold text-gray-900 mb-2">
          Delete Resume?
        </h2>
        <p className="text-sm text-gray-600 mb-1">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-800">
            &ldquo;{resumeTitle || "this resume"}&rdquo;
          </span>
          ?
        </p>
        <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>

        {errorMessage && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
