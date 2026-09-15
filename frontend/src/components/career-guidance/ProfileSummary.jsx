// src/components/career-guidance/ProfileSummary.jsx
import { GraduationCap, Code2, FolderGit2, Briefcase, Award, Heart } from "lucide-react";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileSummary({ profile, topMatches }) {
  const education = profile.highestEducation
    ? [profile.highestEducation.degree, profile.highestEducation.fieldOfStudy].filter(Boolean).join(" in ") || profile.highestEducation.institution
    : "Not added yet";

  const skillNames = profile.explicitSkills.slice(0, 8).map((s) => s.raw).join(", ") || "None added yet";

  const topCategories = [...new Set(topMatches.slice(0, 2).map((m) => m.role.category.toLowerCase()))];
  const potentialText =
    topCategories.length > 0
      ? `Based on your current profile, you show the strongest potential in ${topCategories.join(" and ")}.`
      : "Add a few more skills or projects to your resume for a stronger, more specific analysis.";

  return (
    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-5">Your Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <Stat icon={GraduationCap} label="Education" value={education} />
        <Stat icon={Code2} label="Technical Skills" value={skillNames} />
        <Stat icon={FolderGit2} label="Projects" value={`${profile.counts.projects} project${profile.counts.projects === 1 ? "" : "s"}`} />
        <Stat icon={Briefcase} label="Experience" value={`${profile.counts.workExperience} work · ${profile.counts.internships} internship${profile.counts.internships === 1 ? "" : "s"}`} />
        <Stat icon={Award} label="Certifications" value={`${profile.counts.certifications} certification${profile.counts.certifications === 1 ? "" : "s"}`} />
        <Stat icon={Heart} label="Interests" value={profile.interests.length > 0 ? profile.interests.join(", ") : "Not added yet"} />
      </div>
      <p className="text-sm text-cyan-800 bg-cyan-50 border border-cyan-100 rounded-lg px-4 py-3">{potentialText}</p>
    </div>
  );
}
