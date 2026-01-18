'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download } from 'lucide-react'
import { exportToCSV } from '@/utils/export-csv'
import { exportReportToPDF, generateGradeReportPDF, generateFlagReportPDF, generatePerformancePDF, generateSummaryPDF } from '@/utils/export-pdf'

interface ExportButtonProps {
  data: Record<string, any>[]
  reportType: 'performance' | 'grade' | 'flag' | 'summary'
  filename: string
  pdfOptions: {
    title: string
    term?: string
    dateRange?: { start: string; end: string }
    filters?: Record<string, any>
  }
  disabled?: boolean
}

export function ExportButton({ data, reportType, filename, pdfOptions, disabled }: ExportButtonProps) {
  const handleExportCSV = () => {
    if (data.length === 0) return
    exportToCSV(data, filename)
  }

  const handleExportPDF = async () => {
    if (data.length === 0) return

    try {
      switch (reportType) {
        case 'grade':
          await generateGradeReportPDF(data, pdfOptions)
          break
        case 'flag':
          await generateFlagReportPDF(data, pdfOptions)
          break
        case 'performance':
          await generatePerformancePDF(data, pdfOptions)
          break
        case 'summary':
          await generateSummaryPDF(data, pdfOptions)
          break
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || data.length === 0} className="border-gray-200">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
