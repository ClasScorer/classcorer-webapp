import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 p-8">
      {/* Logo and Header */}
      <section className="flex flex-col items-center mb-12">
        <Image
          src="/logo.jpg"
          alt="ClassScorer Logo"
          width={400}
          height={400}
        />
        
      </section>

      {/* What is ClassScorer */}
      <section className="max-w-3xl mx-auto mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">What is ClassScorer?</h2>
        <p className="text-md">
          🎓 ClassScorer is your all-in-one smart platform designed to empower professors with effortless course and lecture management. Seamlessly track student attendance, monitor engagement, and enhance learning through interactive gamified features — all from one intuitive dashboard. Whether you're leading a large lecture hall or a focused seminar, ClassScorer transforms traditional teaching into a dynamic, data-driven experience.
        </p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">Features</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <li className="bg-purple-100 p-4 rounded-2xl shadow">📊 Attendance Report</li>
          <li className="bg-purple-100 p-4 rounded-2xl shadow">🎮 Gamification</li>
          <li className="bg-purple-100 p-4 rounded-2xl shadow">📈 Monitor Student Activity</li>
          <li className="bg-purple-100 p-4 rounded-2xl shadow">🏆 Leaderboard Report</li>
        </ul>
      </section>

      {/* Team Section */}
      <section className="max-w-3xl mx-auto mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">About the Team</h2>
        <p className="text-md">
          The team consists of five members, each with expertise in different fields:
        </p>
        <ul className="mt-4 space-y-2">
          <li>🤖 Malak Amr – AI Expert</li>
          <li>🤖 Youssef Badir – AI Expert</li>
          <li>🤖 Mohamed Issa – AI Expert</li>
          <li>💻 Mazen Mohamed – Front-End Developer</li>
          <li>🛠️ Adham Ayman – Back-End Developer</li>
        </ul>
      </section>

      {/* Auth Buttons */}
      <section className="flex justify-center space-x-6 mt-10">
        <Link href="/login">
          <Button className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-2 text-lg rounded-xl">
            Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-2 text-lg rounded-xl">
            Sign Up
          </Button>
        </Link>
      </section>
    </main>
  );
}
