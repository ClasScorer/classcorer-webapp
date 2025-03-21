"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CanvasPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/account?tab=integrations")
  }, [router])

  return null // This page redirects, so no content is needed
} 