import jsPDF from 'jspdf'

// PDF Constants
const A4_WIDTH = 210 // mm
const A4_HEIGHT = 297 // mm
const MARGIN = 15 // mm
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2
const HEADER_HEIGHT = 40 // mm
const FOOTER_HEIGHT = 20 // mm
const CONTENT_START_Y = MARGIN + HEADER_HEIGHT

interface PDFOptions {
  title: string
  term?: string
  dateRange?: { start: string; end: string }
  filters?: Record<string, any>
}

/**
 * Load logo image as base64 data URL for PDF embedding
 */
export async function loadLogoImage(): Promise<string> {
  try {
    const response = await fetch('/full logo.png')
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error loading logo:', error)
    return ''
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format date and time for display
 */
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Add header to PDF page
 */
async function addHeader(doc: jsPDF, options: PDFOptions, pageNumber: number, totalPages: number) {
  const logoData = await loadLogoImage()
  const currentY = MARGIN

  // Logo (if available)
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', MARGIN, currentY, 40, 15)
    } catch (error) {
      console.error('Error adding logo:', error)
    }
  }

  // Report Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 95) // Dark blue
  const titleY = logoData ? currentY + 10 : currentY + 5
  doc.text(options.title, A4_WIDTH / 2, titleY, { align: 'center' })

  // Report Metadata
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81) // Dark gray
  let metadataY = titleY + 6

  if (options.term) {
    doc.text(`Term: ${options.term}`, A4_WIDTH / 2, metadataY, { align: 'center' })
    metadataY += 5
  }

  if (options.dateRange) {
    doc.text(
      `Date Range: ${formatDate(options.dateRange.start)} - ${formatDate(options.dateRange.end)}`,
      A4_WIDTH / 2,
      metadataY,
      { align: 'center' },
    )
    metadataY += 5
  }

  // Generation Info
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128) // Medium gray
  doc.text(`Generated: ${formatDateTime(new Date())}`, A4_WIDTH - MARGIN, currentY + 5, {
    align: 'right',
  })

  // Divider line
  doc.setDrawColor(229, 231, 235) // Light gray
  doc.setLineWidth(0.5)
  doc.line(MARGIN, metadataY + 2, A4_WIDTH - MARGIN, metadataY + 2)
}

/**
 * Add footer to PDF page
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const footerY = A4_HEIGHT - MARGIN

  // Divider line
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, footerY - 8, A4_WIDTH - MARGIN, footerY - 8)

  // Institute Name
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  doc.text('Improve ME Institute', MARGIN, footerY)

  // Page Numbers
  doc.text(`Page ${pageNumber} of ${totalPages}`, A4_WIDTH - MARGIN, footerY, { align: 'right' })
}

/**
 * Add table to PDF
 */
function addTable(
  doc: jsPDF,
  headers: string[],
  rows: (string | number)[][],
  startY: number,
  columnWidths?: number[],
): number {
  const rowHeight = 7 // mm
  const headerHeight = 8 // mm
  const cellPadding = 3 // mm horizontal, 2mm vertical

  // Calculate column widths if not provided
  const widths =
    columnWidths ||
    headers.map(() => CONTENT_WIDTH / headers.length) // Equal width columns

  let currentY = startY

  // Table Header
  doc.setFillColor(51, 51, 51) // Dark gray background
  doc.rect(MARGIN, currentY, CONTENT_WIDTH, headerHeight, 'F')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255) // White text

  let x = MARGIN
  headers.forEach((header, i) => {
    doc.text(header, x + cellPadding, currentY + 5, {
      align: 'left',
      maxWidth: widths[i] - cellPadding * 2,
    })
    x += widths[i]
  })

  currentY += headerHeight

  // Table Rows
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y

      // Repeat header on new page
      doc.setFillColor(51, 51, 51)
      doc.rect(MARGIN, currentY, CONTENT_WIDTH, headerHeight, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)

      x = MARGIN
      headers.forEach((header, i) => {
        doc.text(header, x + cellPadding, currentY + 5, {
          align: 'left',
          maxWidth: widths[i] - cellPadding * 2,
        })
        x += widths[i]
      })

      currentY += headerHeight
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245) // Light gray
      doc.rect(MARGIN, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.setTextColor(0, 0, 0) // Black text

    // Draw row cells
    x = MARGIN
    row.forEach((cell, colIndex) => {
      const cellValue = cell?.toString() || ''
      const isNumeric = typeof cell === 'number' || (!isNaN(Number(cellValue)) && cellValue !== '')

      doc.text(cellValue, x + cellPadding, currentY + 4.5, {
        align: isNumeric ? 'right' : 'left',
        maxWidth: widths[colIndex] - cellPadding * 2,
      })

      // Vertical line between columns (optional, minimal design)
      if (colIndex < row.length - 1) {
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.2)
        doc.line(x + widths[colIndex], currentY, x + widths[colIndex], currentY + rowHeight)
      }

      x += widths[colIndex]
    })

    // Horizontal line between rows
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, currentY + rowHeight, A4_WIDTH - MARGIN, currentY + rowHeight)

    currentY += rowHeight
  })

  return currentY
}

/**
 * Generate Performance Report PDF
 */
export async function generatePerformancePDF(data: any[], options: PDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const totalPages = Math.ceil(data.length / 25)

  // Prepare table data
  const hasTeacher = data[0]?.teacher !== undefined
  const headers = hasTeacher
    ? ['Class', 'Teacher', 'Avg %', 'Low Points', 'Grades']
    : ['Class', 'Avg %', 'Low Points', 'Grades']
  
  const rows = data.map((item) => {
    if (hasTeacher) {
      return [
        item.name || 'N/A',
        item.teacher || 'N/A',
        `${item.avgPercentage}%`,
        (item.lpCount || 0).toString(),
        (item.gradeCount || 0).toString(),
      ]
    } else {
      return [
        item.name || 'N/A',
        `${item.avgPercentage}%`,
        (item.lpCount || 0).toString(),
        (item.gradeCount || 0).toString(),
      ]
    }
  })

  // Add header to first page
  await addHeader(doc, options, 1, totalPages)

  // Add table
  let currentY = CONTENT_START_Y + 5
  addTable(doc, headers, rows, currentY)

  // Update page numbers and add footers to all pages
  const actualPages = (doc as any).getNumberOfPages()
  for (let i = 1; i <= actualPages; i++) {
    doc.setPage(i)
    if (i > 1) {
      await addHeader(doc, options, i, actualPages)
    }
    addFooter(doc, i, actualPages)
  }

  const filename = `${options.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Generate Grade Report PDF
 */
export async function generateGradeReportPDF(
  grades: any[],
  options: PDFOptions,
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const totalPages = Math.ceil(grades.length / 25) // Approximate pages needed

  // Prepare table data
  const headers = ['Student', 'Class', 'Course', 'Topic', 'Marks', '%', 'Date', 'Type']
  const rows = grades.map((grade) => [
    grade.students?.name || 'N/A',
    grade.classes?.name || 'N/A',
    grade.courses?.name || 'N/A',
    grade.topics?.name || 'N/A',
    `${grade.marks_obtained}/${grade.total_marks}`,
    `${grade.percentage}%`,
    formatDate(grade.assessed_date),
    grade.work_type,
  ])

  // Add header to first page
  await addHeader(doc, options, 1, totalPages)

  // Add table
  let currentY = CONTENT_START_Y + 5
  addTable(doc, headers, rows, currentY)

  // Update page numbers and add footers to all pages
  const actualPages = (doc as any).getNumberOfPages()
  for (let i = 1; i <= actualPages; i++) {
    doc.setPage(i)
    if (i > 1) {
      await addHeader(doc, options, i, actualPages)
    }
    addFooter(doc, i, actualPages)
  }

  const filename = `grade_report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Generate Flag Report PDF
 */
export async function generateFlagReportPDF(flaggedStudents: any[], options: PDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const totalPages = Math.ceil(flaggedStudents.length / 25)

  // Prepare table data
  const headers = ['Student', 'Class', 'Course', 'Low Points', 'Flags', 'Status', 'Contacted']
  const rows = flaggedStudents.map((student) => [
    student.student_name || 'N/A',
    student.class_name || 'N/A',
    student.course_name || 'N/A',
    student.low_points?.toString() || '0',
    student.flag_count?.toString() || '0',
    student.status || 'N/A',
    student.contacts?.some((c: any) => c.status === 'contacted') ? 'Yes' : 'No',
  ])

  // Add header
  await addHeader(doc, options, 1, totalPages)

  // Add table
  let currentY = CONTENT_START_Y + 5
  addTable(doc, headers, rows, currentY)

  // Update footers on all pages
  const actualPages = (doc as any).getNumberOfPages()
  for (let i = 1; i <= actualPages; i++) {
    doc.setPage(i)
    if (i > 1) {
      await addHeader(doc, options, i, actualPages)
    }
    addFooter(doc, i, actualPages)
  }

  const filename = `flag_report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Generate Summary Report PDF
 */
export async function generateSummaryPDF(data: any[], options: PDFOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Add header
  await addHeader(doc, options, 1, 1)

  let currentY = CONTENT_START_Y + 5

  // Summary Statistics Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 95)
  doc.text('Summary Statistics', MARGIN, currentY)
  currentY += 15

  // Display summary data as key-value pairs
  if (data.length > 0) {
    const summary = data[0]
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)

    Object.entries(summary).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
        const valueStr = typeof value === 'number' ? value.toString() : String(value)
        
        doc.setFont('helvetica', 'bold')
        doc.text(`${label}:`, MARGIN, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(valueStr, MARGIN + 60, currentY)
        currentY += 8
      }
    })
  }

  // Add footer
  addFooter(doc, 1, (doc as any).getNumberOfPages())

  const filename = `summary_report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Add section title to PDF
 */
function addSectionTitle(doc: jsPDF, title: string, currentY: number): number {
  const sectionSpacing = 10 // mm between sections
  
  // Add spacing before section (except first)
  let y = currentY + sectionSpacing
  
  // Check if we need a new page
  if (y + 20 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
    doc.addPage()
    y = CONTENT_START_Y + 5
  }
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 95) // Dark blue
  doc.text(title, MARGIN, y)
  
  // Underline
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y + 2, MARGIN + 60, y + 2)
  
  return y + 8 // Return next Y position
}

/**
 * Add key-value pair to PDF
 */
function addKeyValue(doc: jsPDF, key: string, value: string, x: number, y: number, maxWidth?: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(55, 65, 81) // Dark gray
  doc.text(`${key}:`, x, y)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0) // Black
  const lines = doc.splitTextToSize(value, maxWidth || CONTENT_WIDTH - x - MARGIN)
  doc.text(lines, x + 40, y)
  
  return y + lines.length * 5 + 3 // Return next Y position
}

/**
 * Generate Student Profile PDF
 */
export async function generateStudentProfilePDF(
  studentData: {
    student: any
    enrolledClasses: any[]
    grades: any[]
    contacts: any[]
    notes: any[]
    activeTerm: any
  },
  options: PDFOptions,
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const { student, enrolledClasses, grades, contacts, notes, activeTerm } = studentData

  // Calculate statistics (same as page)
  const totalGrades = grades.length
  const totalLPs = grades.filter((g: any) => g.is_low_point).length
  const avgPercentage = totalGrades > 0
    ? Math.round(grades.reduce((sum: number, g: any) => sum + g.percentage, 0) / totalGrades)
    : 0
  const flagCount = totalLPs >= 5 ? 3 : totalLPs >= 4 ? 2 : totalLPs >= 3 ? 1 : 0

  // Performance by course
  const coursePerformance = enrolledClasses.map((ec: any) => {
    const courseGrades = grades.filter((g: any) => g.course_id === ec.course_id)
    const courseAvg = courseGrades.length > 0
      ? Math.round(courseGrades.reduce((sum: number, g: any) => sum + g.percentage, 0) / courseGrades.length)
      : 0
    const courseLPs = courseGrades.filter((g: any) => g.is_low_point).length

    return {
      courseId: ec.course_id,
      courseName: ec.courses?.name || 'N/A',
      qualification: ec.courses?.qualifications?.name || '',
      board: ec.courses?.boards?.name || '',
      gradesCount: courseGrades.length,
      lpCount: courseLPs,
      avg: courseAvg,
      status: courseAvg < 70 ? 'Struggling' : courseAvg < 80 ? 'At Risk' : 'On Track',
    }
  })

  // Struggling areas
  const strugglingAreas = grades
    .filter((g: any) => g.is_low_point)
    .reduce((acc: any[], g: any) => {
      const existing = acc.find((a) => a.topicId === g.topic_id && a.subtopicId === g.subtopic_id)
      if (existing) {
        existing.lpCount++
      } else {
        acc.push({
          topicId: g.topic_id,
          subtopicId: g.subtopic_id,
          topicName: g.topics?.name || 'N/A',
          subtopicName: g.subtopics?.name || 'N/A',
          courseName: g.courses?.name || 'N/A',
          lpCount: 1,
          latestGrade: g.percentage,
          latestDate: g.assessed_date,
        })
      }
      return acc
    }, [])
    .sort((a: any, b: any) => b.lpCount - a.lpCount)
    .slice(0, 5)

  let currentY = CONTENT_START_Y + 5

  // Section 1: Student Information
  currentY = addSectionTitle(doc, 'Student Information', currentY)

  const studentInfo = [
    ['Student Name', student.name || 'N/A'],
    ['Student ID', student.id?.slice(0, 8) || 'N/A'],
    ['Year Group', student.year_group || 'N/A'],
    ['School', student.school || 'N/A'],
    ['Enrollment Date', formatDate(student.created_at)],
    ['Current Term', activeTerm?.name || 'N/A'],
    ['Total Classes', enrolledClasses.length.toString()],
  ]

  studentInfo.forEach(([key, value]) => {
    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }
    currentY = addKeyValue(doc, key, value, MARGIN, currentY)
  })

  // Section 2: Academic Overview
  currentY = addSectionTitle(doc, 'Academic Overview', currentY)

  const academicStats = [
    ['Classes', enrolledClasses.length.toString()],
    ['Grades Entered', totalGrades.toString()],
    ['Low Points', totalLPs.toString()],
    ['Flags', flagCount > 0 ? `${flagCount} Flag${flagCount > 1 ? 's' : ''}` : '0'],
    ['Average Percentage', `${avgPercentage}%`],
  ]

  academicStats.forEach(([key, value]) => {
    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }
    currentY = addKeyValue(doc, key, value, MARGIN, currentY)
  })

  // Section 3: Flagging Alert (if applicable)
  if (flagCount > 0) {
    currentY = addSectionTitle(doc, 'Student Requires Attention', currentY)

    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const alertText =
      flagCount === 1
        ? '1 Flag (3 Low Points) - Message parents recommended'
        : flagCount === 2
          ? '2 Flags (4 Low Points) - Call parents needed'
          : '3 Flags (5+ Low Points) - Meeting required'

    const alertLines = doc.splitTextToSize(alertText, CONTENT_WIDTH)
    doc.text(alertLines, MARGIN, currentY)
    currentY += alertLines.length * 5 + 5
  }

  // Section 4: Performance Breakdown by Course (Table)
  if (coursePerformance.length > 0) {
    currentY = addSectionTitle(doc, 'Performance Breakdown by Course', currentY)

    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    const headers = ['Course Name', 'Grades', 'Low Points', 'Average %', 'Status']
    const rows = coursePerformance.map((cp) => [
      cp.courseName,
      cp.gradesCount.toString(),
      cp.lpCount.toString(),
      `${cp.avg}%`,
      cp.status,
    ])

    currentY = addTable(doc, headers, rows, currentY, [60, 20, 25, 30, 35])
    currentY += 5
  }

  // Section 5: Struggling Areas
  if (strugglingAreas.length > 0) {
    currentY = addSectionTitle(doc, 'Topics Requiring Attention', currentY)

    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    const strugglingHeaders = ['Course', 'Topic → Subtopic', 'Low Points', 'Latest Grade']
    const strugglingRows = strugglingAreas.map((area) => [
      area.courseName,
      `${area.topicName} → ${area.subtopicName}`,
      area.lpCount.toString(),
      `${area.latestGrade}%`,
    ])

    currentY = addTable(doc, strugglingHeaders, strugglingRows, currentY, [50, 80, 25, 25])
    currentY += 5
  }

  // Section 6: Recent Activity (Grade History)
  if (grades.length > 0) {
    currentY = addSectionTitle(doc, 'Recent Activity', currentY)

    if (currentY + 15 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    const recentGrades = grades.slice(0, 20) // Limit to 20 most recent
    const gradeHeaders = ['Date', 'Course', 'Topic', 'Marks', '%', 'Type', 'Status']
    const gradeRows = recentGrades.map((g: any) => [
      formatDate(g.assessed_date),
      g.courses?.name || 'N/A',
      g.topics?.name || 'N/A',
      `${g.marks_obtained}/${g.total_marks}`,
      `${g.percentage}%`,
      g.work_type === 'classwork' ? 'Classwork' : 'Homework',
      g.is_low_point ? 'LP' : 'Pass',
    ])

    currentY = addTable(doc, gradeHeaders, gradeRows, currentY, [25, 35, 35, 20, 15, 25, 15])
    currentY += 5
  }

  // Section 7: Performance Trends (as table)
  if (grades.length > 0) {
    currentY = addSectionTitle(doc, 'Performance Trends', currentY)

    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    // Grade Timeline as table
    const timelineGrades = [...grades].reverse().slice(0, 15)
    const timelineHeaders = ['Date', 'Percentage', 'Topic', 'Status']
    const timelineRows = timelineGrades.map((g: any) => [
      formatDate(g.assessed_date),
      `${g.percentage}%`,
      g.topics?.name || 'N/A',
      g.is_low_point ? 'Low Point' : 'Pass',
    ])

    currentY = addTable(doc, timelineHeaders, timelineRows, currentY, [40, 25, 80, 30])
    currentY += 10

    // Course Performance as table
    if (coursePerformance.length > 0) {
      const courseHeaders = ['Course', 'Average %', 'Status']
      const courseRows = coursePerformance.map((cp) => [`${cp.courseName}`, `${cp.avg}%`, cp.status])

      if (currentY + 15 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
        doc.addPage()
        currentY = CONTENT_START_Y + 5
      }

      currentY = addTable(doc, courseHeaders, courseRows, currentY, [100, 35, 35])
      currentY += 5
    }
  }

  // Section 8: Contact Information
  currentY = addSectionTitle(doc, 'Contact Information', currentY)

  if (contacts.length > 0) {
    const contact = contacts[0]
    
    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    currentY = addKeyValue(doc, 'Parent/Guardian Name', contact.parent_name || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Relationship', contact.relationship || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Email', contact.email || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Phone', contact.phone || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Preferred Contact', contact.preferred_contact_method || 'Email', MARGIN, currentY)
    currentY += 5

    if (currentY + 10 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }

    currentY = addKeyValue(doc, 'Address', contact.address || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'City', contact.city || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Postal Code', contact.postal_code || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Emergency Contact', contact.emergency_contact_name || 'N/A', MARGIN, currentY)
    currentY = addKeyValue(doc, 'Emergency Phone', contact.emergency_contact_phone || 'N/A', MARGIN, currentY)
  } else {
    if (currentY + 5 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
      doc.addPage()
      currentY = CONTENT_START_Y + 5
    }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('No contact information available', MARGIN, currentY)
    currentY += 8
  }

  // Section 9: Teacher Notes
  if (notes.length > 0) {
    currentY = addSectionTitle(doc, 'Teacher Notes & Observations', currentY)

    notes.slice(0, 10).forEach((note: any) => {
      if (currentY + 15 > A4_HEIGHT - FOOTER_HEIGHT - MARGIN) {
        doc.addPage()
        currentY = CONTENT_START_Y + 5
      }

      const noteAuthor = note.profiles?.full_name || note.profiles?.email || 'Unknown'
      const noteDate = formatDateTime(note.created_at)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(55, 65, 81)
      doc.text(`${noteAuthor} - ${noteDate}`, MARGIN, currentY)
      currentY += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const noteLines = doc.splitTextToSize(note.content || '', CONTENT_WIDTH)
      doc.text(noteLines, MARGIN, currentY)
      currentY += noteLines.length * 4 + 8

      // Divider line
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, currentY - 3, A4_WIDTH - MARGIN, currentY - 3)
    })
  }

  // Add headers and footers to all pages
  const actualPages = (doc as any).getNumberOfPages()
  for (let i = 1; i <= actualPages; i++) {
    doc.setPage(i)
    if (i === 1) {
      await addHeader(doc, options, i, actualPages)
    } else {
      await addHeader(doc, options, i, actualPages)
    }
    addFooter(doc, i, actualPages)
  }

  const studentName = student.name?.toLowerCase().replace(/\s+/g, '_') || 'student'
  const filename = `student_profile_${studentName}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Generic PDF export function
 */
export async function exportReportToPDF(
  data: any,
  reportType: 'performance' | 'grade' | 'flag' | 'summary',
  filename: string,
  options: PDFOptions,
): Promise<void> {
  switch (reportType) {
    case 'performance':
      await generatePerformancePDF(data, options)
      break
    case 'grade':
      await generateGradeReportPDF(data, options)
      break
    case 'flag':
      await generateFlagReportPDF(data, options)
      break
    case 'summary':
      await generateSummaryPDF(data, options)
      break
    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}
