import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
    >
       ←
    </button>
  );
}

export default BackButton;