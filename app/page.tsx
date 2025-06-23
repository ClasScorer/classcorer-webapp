import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing-navbar";
import { AnimatedBackground } from "@/components/animated-background";
import { FeatureCard } from "@/components/feature-card";
import { TeamMember } from "@/components/team-member";

export default function LandingPage() {
  const features = [
    {
      icon: "📊",
      title: "Attendance Report",
      description: "Track student attendance with precision and generate comprehensive reports for better insights."
    },
    {
      icon: "🎮",
      title: "Gamification",
      description: "Engage students through interactive gamified features that make learning fun and motivating."
    },
    {
      icon: "📈",
      title: "Monitor Student Activity",
      description: "Real-time monitoring of student engagement and participation during lectures."
    },
    {
      icon: "🏆",
      title: "Leaderboard Report",
      description: "Competitive leaderboards to encourage student participation and recognize top performers."
    }
  ];

  const teamMembers = [
    {
      name: "Malak Amr",
      role: "AI Engineer",
      description: "Specialized in machine learning algorithms and AI system development.",
      image: "/team/Malak.jpg",
      emoji: "🤖"
    },
    {
      name: "Youssef Badir",
      role: "Team Leader & AI Engineer",
      description: "Expert in computer vision and natural language processing technologies.",
      image: "/team/placeholder.jpg",
      emoji: "🤖"
    },
    {
      name: "Mohamed Issa",
      role: "AI Engineer",
      description: "Focused on deep learning and neural network architecture design.",
      image: "/team/placeholder.jpg",
      emoji: "🤖"
    },
    {
      name: "Mazen Mohamed",
      role: "Software Developer",
      description: "Creating beautiful and responsive user interfaces with modern web technologies.",
      image: "/team/placeholder.jpg",
      emoji: "💻"
    },
    {
      name: "Adham Ayman",
      role: "Software Developer",
      description: "Building robust server-side systems and database architecture.",
      image: "/team/placeholder.jpg",
      emoji: "🛠️"
    }
  ];

  return (
    <>
      <AnimatedBackground />
      <LandingNavbar />
      
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Image
                src="/logo.jpg"
                alt="ClassScorer Logo"
                width={200}
                height={200}
                className="mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ClassScorer
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your teaching experience with our smart platform designed to empower professors with effortless course and lecture management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg rounded-xl">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-8 py-3 text-lg rounded-xl">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                What is ClassScorer?
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-center">
                🎓 ClassScorer is your all-in-one smart platform designed to empower professors with effortless course and lecture management. 
                Seamlessly track student attendance, monitor engagement, and enhance learning through interactive gamified features — all from one intuitive dashboard. 
                Whether you're leading a large lecture hall or a focused seminar, ClassScorer transforms traditional teaching into a dynamic, data-driven experience.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Features
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto rounded-full mb-8"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover the powerful tools that make ClassScorer the ultimate platform for modern education.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Meet Our Team
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto rounded-full mb-8"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Our diverse team of experts brings together cutting-edge technology and innovative solutions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {teamMembers.map((member, index) => (
                <TeamMember
                  key={index}
                  name={member.name}
                  role={member.role}
                  description={member.description}
                  image={member.image}
                  emoji={member.emoji}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Teaching?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Join thousands of professors who are already using ClassScorer to enhance their teaching experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg rounded-xl font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg rounded-xl">
                    Login to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
