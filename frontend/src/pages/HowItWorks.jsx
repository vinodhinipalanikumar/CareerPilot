// src/pages/HowItWorks.jsx
import MainLayout from "../layouts/MainLayout";
import BackButton from "../components/BackButton";

export default function HowItWorks() {
  return (
    <MainLayout>
        
      <div className="flex items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-blue-600 text-center">
          How It Works
        </h1>
      </div>
    </MainLayout>
  );
}