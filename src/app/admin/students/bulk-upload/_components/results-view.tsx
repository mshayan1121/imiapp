'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImportResult } from '../_types'
import { CheckCircle, XCircle, Users, Home, UserPlus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface ResultsViewProps {
  results: ImportResult
  onReset: () => void
  onClose?: () => void
}

export function ResultsView({ results, onReset, onClose }: ResultsViewProps) {
  const successCount = results.success.length
  const failedCount = results.failed.length

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <Alert className="bg-green-50 border-green-200 text-green-900">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-lg font-medium ml-2">Import Completed!</AlertTitle>
        <AlertDescription className="ml-2">
          {successCount} students imported successfully.
          {failedCount > 0 && ` ${failedCount} failed.`}
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold">{successCount}</div>
            <div className="text-sm text-gray-500">Imported</div>
          </CardContent>
        </Card>
        {failedCount > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <XCircle className="h-8 w-8 text-red-500 mb-2" />
              <div className="text-2xl font-bold">{failedCount}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Table */}
      {successCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imported Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.success.map((record, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{record.fullName}</TableCell>
                      <TableCell className="text-sm">{record.email || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Table */}
      {failedCount > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Failed Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-red-100 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-red-50">
                  <TableRow>
                    <TableHead className="text-red-700">Name</TableHead>
                    <TableHead className="text-red-700">Email</TableHead>
                    <TableHead className="text-red-700">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.failed.map((record, i) => (
                    <TableRow key={i}>
                      <TableCell>{record.fullName}</TableCell>
                      <TableCell className="text-sm">{record.email}</TableCell>
                      <TableCell className="text-red-600">{record.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
          <Users className="mr-2 h-4 w-4" />
          View Student Directory
        </Button>
        <Button variant="outline" onClick={onReset}>
          <UserPlus className="mr-2 h-4 w-4" />
          Import More Students
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
