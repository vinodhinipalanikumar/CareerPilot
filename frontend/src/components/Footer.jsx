// Footer.jsx

// Quick Links data
const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Login", href: "#login" },
];

export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white mt-20">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              CareerPilot
            </h2>

            <p className="text-blue-100 leading-relaxed">
              Helping students build resumes, ace ATS checks,
              and prepare for placements with AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Quick Links
            </h3>

            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-blue-100 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Contact
            </h3>

            <a
              href="mailto:support@careerpilot.com"
              className="text-blue-100 hover:text-white transition-colors duration-200"
            >
              support@careerpilot.com
            </a>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-blue-500">
        <p className="text-center text-blue-100 text-sm py-6">
          © 2026 CareerPilot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}