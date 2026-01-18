'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImportResult } from '../_types'
import { CheckCircle, AlertTriangle, Copy, Download, XCircle, ArrowLeft, Users, Home } from 'lucide-react'
import { toast } from 'sonner'
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
}

export function ResultsView({ results, onReset }: ResultsViewProps) {
  const successCount = results.success.length
  const failedCount = results.failed.length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const copyAllPasswords = () => {
    const text = results.success
      .map(r => `Name: ${r.fullName}\nEmail: ${r.email}\nPassword: ${r.tempPassword}\n`)
      .join('\n-------------------\n')
    copyToClipboard(text)
    toast.success('All passwords copied to clipboard')
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Temporary Password']
    const csvContent = [
      headers.join(','),
      ...results.success.map(r => [r.fullName, r.email, r.tempPassword].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `teacher_credentials_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Credentials CSV downloaded')
  }

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <Alert className="bg-green-50 border-green-200 text-green-900">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-lg font-medium ml-2">Import Completed Successfully!</AlertTitle>
        <AlertDescription className="ml-2">
          {successCount} teachers imported. Share credentials securely.
          {failedCount > 0 && ` ${failedCount} failed.`}
        </AlertDescription>
      </Alert>

      {/* Important Warning */}
      <Alert className="bg-amber-50 border-amber-200 text-amber-900">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="font-medium ml-2">Share Credentials Securely</AlertTitle>
        <AlertDescription className="ml-2">
          Passwords are shown below. Share them with teachers via WhatsApp, email, or in-person. 
          Teachers can change their password after first login.
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Import Details - Teacher Credentials</CardTitle>
            <Button variant="outline" size="sm" onClick={copyAllPasswords}>
              <Copy className="mr-2 h-4 w-4" />
              Copy All Passwords
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Temporary Password</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.success.map((record, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{record.fullName}</TableCell>
                      <TableCell className="font-mono text-sm">{record.email}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border border-gray-200">
                          {record.tempPassword}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const text = `Email: ${record.email}\nPassword: ${record.tempPassword}`;
                            copyToClipboard(text);
                          }}
                          title="Copy credentials"
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" onClick={downloadCSV} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Credentials (CSV)
              </Button>
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
                      <TableCell className="font-mono text-sm">{record.email}</TableCell>
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
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/users">
            <Users className="mr-2 h-4 w-4" />
            View All Teachers
          </Link>
        </Button>
        <Button variant="outline" onClick={onReset}>
          <UserPlus className="mr-2 h-4 w-4" />
          Import More Teachers
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
