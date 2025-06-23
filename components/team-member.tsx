"use client"

import Image from "next/image"
import { User } from "lucide-react"

interface TeamMemberProps {
  name: string
  role: string
  description: string
  image: string
  emoji: string
}

export function TeamMember({ name, role, description, image, emoji }: TeamMemberProps) {
  return (
    <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Member Image */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-300 dark:group-hover:ring-purple-700 transition-all duration-300 bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700">
          {image && image !== "/team/placeholder.jpg" ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = parent.querySelector('.placeholder-icon');
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = 'flex';
                  }
                }
              }}
            />
          ) : null}
          <div className="placeholder-icon flex items-center justify-center w-full h-full text-white text-3xl">
            <User className="w-12 h-12" />
          </div>
        </div>
        
        {/* Member Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">{emoji}</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
          </div>
          <p className="text-purple-600 dark:text-purple-400 font-medium">
            {role}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
} 