import { Construction } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface UnderConstructionProps {
  title?: string
  description?: string
  showBackButton?: boolean
  backButtonHref?: string
}

export function UnderConstruction({
  title = "Page Under Construction",
  description = "We're working hard to bring you this feature. Please check back soon!",
  showBackButton = true,
  backButtonHref = "/dashboard"
}: UnderConstructionProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Construction className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-center text-muted-foreground">
          {description}
        </p>
        {showBackButton && (
          <Link href={backButtonHref} className="mt-6">
            <Button>Go Back</Button>
          </Link>
        )}
      </div>
    </div>
  )
} 