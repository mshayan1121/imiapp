import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Term } from './columns'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

interface ActiveTermCardProps {
  term: Term | null
}

export function ActiveTermCard({ term }: ActiveTermCardProps) {
  if (!term) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            No Active Term
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Please set an active term to enable grade entry and calculations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Active Term: {term.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-green-700 font-medium">{term.academic_year}</p>
            <p className="text-green-600 text-sm">
              {format(new Date(term.start_date), 'MMMM d, yyyy')} -{' '}
              {format(new Date(term.end_date), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white hover:bg-green-100 text-green-700 border-green-300"
            >
              View Grades
            </Button>
            <Button
              variant="outline"
              className="bg-white hover:bg-green-100 text-green-700 border-green-300"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
