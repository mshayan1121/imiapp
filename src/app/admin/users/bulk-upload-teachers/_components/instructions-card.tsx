import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function InstructionsCard() {
  const downloadTemplate = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Status']
    const examples = [
      ['John', 'Doe', 'john.doe@example.com', 'Active'],
      ['Jane', 'Smith', 'jane.smith@example.com', 'Active'],
      ['Robert', 'Brown', 'robert.brown@example.com', 'Inactive'],
    ]

    const csvContent = [
      headers.join(','),
      ...examples.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'teachers_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">How to Import Teachers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold mb-3">Steps to Follow:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Export staff from ClassCard (CSV or Excel format)</li>
              <li>Upload the file below</li>
              <li>Review the preview and confirm import</li>
              <li>Copy passwords and share with teachers manually</li>
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Required Columns:</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Column Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Required</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2">First Name</td>
                    <td className="px-4 py-2 text-red-600">Yes</td>
                    <td className="px-4 py-2 text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Last Name</td>
                    <td className="px-4 py-2 text-red-600">Yes</td>
                    <td className="px-4 py-2 text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Email</td>
                    <td className="px-4 py-2 text-red-600">Yes</td>
                    <td className="px-4 py-2 text-gray-500">Unique</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Status</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">Active/Inactive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
