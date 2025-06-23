"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.jpg"
              alt="ClassScorer Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ClassScorer
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="#about" 
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              About
            </Link>
            <Link 
              href="#features" 
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Features
            </Link>
            <Link 
              href="#team" 
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Team
            </Link>
          </div>

          {/* Auth Buttons and Theme Toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 