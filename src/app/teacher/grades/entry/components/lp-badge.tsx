'use client'

import { Badge } from '@/components/ui/badge'

interface LowPointBadgeProps {
  percentage: number
}

export function LowPointBadge({ percentage }: LowPointBadgeProps) {
  const isLowPoint = percentage < 80

  if (isLowPoint) {
    return (
      <Badge variant="destructive" className="font-semibold">
        Low Point
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold border-green-200"
    >
      Pass
    </Badge>
  )
}
