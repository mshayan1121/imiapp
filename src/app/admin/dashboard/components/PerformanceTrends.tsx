'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PerformanceTrendsProps {
  data: {
    performanceData: { term: string; avg: number }[]
    subjectData: { subject: string; flags: number }[]
    gradeDistribution: { name: string; value: number; color: string }[]
  }
}

export function PerformanceTrends({ data }: PerformanceTrendsProps) {
  const [Recharts, setRecharts] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    import('recharts').then((mod) => {
      setRecharts(mod)
      setIsLoading(false)
    })
  }, [])

  const hasData = data.performanceData.length > 0 || data.subjectData.length > 0 || data.gradeDistribution.length > 0

  if (!hasData) {
    return (
      <Card className="border-gray-200 shadow-sm p-8 text-center text-gray-500">
        No performance data available for trends.
      </Card>
    )
  }

  if (isLoading || !Recharts) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200 shadow-sm">
            <CardContent className="h-[250px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie,
  } = Recharts

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Institute Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {data.performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.performanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="term"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No performance data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Flags by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {data.subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="subject"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="flags" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No flag data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            {data.gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No distribution data
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {data.gradeDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
