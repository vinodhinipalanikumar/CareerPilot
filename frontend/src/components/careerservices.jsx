import {
  FileText,
  ScanSearch,
  Compass,
  Mic,
} from "lucide-react";
import { Link } from "react-router-dom";

// Data for each service card
const services = [
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create professional resumes using multiple modern templates.",
    link: "/resume-builder",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    button: "text-blue-600 hover:text-blue-800",
  },
  {
    icon: ScanSearch,
    title: "ATS Analysis",
    description: "Analyze resumes and improve your ATS score using AI.",
    link: "/ats-analysis",
    bg: "bg-sky-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    button: "text-sky-600 hover:text-sky-800",
  },
  {
    icon: Compass,
    title: "Career Guidance",
    description: "Get personalized career suggestions based on your skills.",
    link: "/career-guidance",
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    button: "text-cyan-600 hover:text-cyan-800",
  },
  {
    icon: Mic,
    title: "Mock Interview",
    description: "Practice HR and technical interviews with AI.",
    link: "/mock-interview",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    button: "text-indigo-600 hover:text-indigo-800",
  },
];
// Single Card Component
function ServiceCard({
  icon: Icon,
  title,
  description,
  bg,
  iconBg,
  iconColor,
  button,
  link,
}) {
 return (
  <Link to={link} className="block">
    <div
      className={`${bg} rounded-2xl shadow-md p-8 hover:shadow-xl hover:-translate-y-2 transition duration-300 flex flex-col h-full`}
    >
      {/* Icon */}
      <div
        className={`${iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-5`}
      >
        <Icon className={`${iconColor} w-7 h-7`} />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed flex-grow">
        {description}
      </p>

      {/* Button */}
      <span
        className={`mt-6 inline-flex items-center gap-2 font-semibold ${button} transition-all duration-300 hover:gap-3`}
      >
        Get Started →
      </span>
    </div>
  </Link>
);
}
// Main Component
export default function CareerServices() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Everything You Need For Your Career
        </h2>

        {/* Subtitle */}
        <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-14">
          CareerPilot provides all the tools required to build
          professional resumes and prepare for placements with
          AI-powered guidance.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <ServiceCard
              key={service.title}
              {...service}
            />
          ))}
        </div>

      </div>
    </section>
  );
}