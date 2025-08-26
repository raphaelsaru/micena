"use client"

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { DistribuicaoServicos } from "@/lib/dashboard"

interface DistribuicaoServicosChartProps {
  data: DistribuicaoServicos[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function DistribuicaoServicosChart({ data }: DistribuicaoServicosChartProps) {
  const chartConfig = {
    AREIA: {
      label: "Areia",
      color: "#3b82f6"
    },
    EQUIPAMENTO: {
      label: "Equipamento",
      color: "#10b981"
    },
    CAPA: {
      label: "Capa",
      color: "#f59e0b"
    },
    OUTRO: {
      label: "Outro",
      color: "#ef4444"
    }
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Distribuição de Serviços (Últimos 30 Dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="quantidade"
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.tipo}-${entry.quantidade}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value, name) => [value, chartConfig[name as keyof typeof chartConfig]?.label || name]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
