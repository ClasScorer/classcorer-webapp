interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Feature Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        
        {/* Feature Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
} 