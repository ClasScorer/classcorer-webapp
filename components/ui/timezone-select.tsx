"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Get all timezone names
const timezones = Intl.supportedValuesOf('timeZone')

export function TimezoneSelect({
  value,
  onValueChange,
}: {
  value?: string
  onValueChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        {timezones.map((timezone) => (
          <SelectItem key={timezone} value={timezone}>
            {timezone.replace(/_/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 