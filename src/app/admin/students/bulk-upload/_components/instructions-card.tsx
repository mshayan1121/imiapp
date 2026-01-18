import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function InstructionsCard() {
  const downloadTemplate = () => {
    const headers = ['Name', 'School Year', 'School', 'Status', 'Email', 'Phone', 'Guardian Name']
    const examples = [
      ['John Doe', 'Year 12/Grade 11', 'International School', 'Active', 'john@example.com', '1234567890', 'Jane Doe'],
      ['Jane Smith', 'Year 11/Grade 10', 'City High', 'Active', 'jane@example.com', '0987654321', 'Bob Smith'],
      ['Robert Brown', 'Year 9/Grade 8', 'Greenwood Academy', 'Inactive', 'robert@example.com', '1122334455', 'Mary Brown'],
    ]

    const csvContent = [
      headers.join(','),
      ...examples.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'students_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">How to Import Students</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold mb-3">Steps to Follow:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Prepare your student list (CSV or Excel format)</li>
              <li>Upload the file below</li>
              <li>Review the preview and confirm import</li>
              <li>Only "Active" students will be imported</li>
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
                    <td className="px-4 py-2">Name</td>
                    <td className="px-4 py-2 text-red-600">Yes</td>
                    <td className="px-4 py-2 text-gray-500">Full Name</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">School Year</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">e.g. Year 12/Grade 11</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">School</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">School Name</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Status</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">Only Active imported</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Email</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">Student Info</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Phone</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">Parent Info</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Guardian Name</td>
                    <td className="px-4 py-2 text-gray-500">No</td>
                    <td className="px-4 py-2 text-gray-500">Info</td>
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
