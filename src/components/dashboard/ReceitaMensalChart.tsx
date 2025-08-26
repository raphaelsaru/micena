"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ReceitaMensal } from "@/lib/dashboard"

interface ReceitaMensalChartProps {
  data: ReceitaMensal[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function ReceitaMensalChart({ data }: ReceitaMensalChartProps) {
  const chartConfig = {
    valor: {
      label: "Receita",
      color: "#3b82f6"
    }
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Receita Mensal (Últimos 6 Meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="mes" 
              tickFormatter={(value) => value}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                />
              }
            />
            <Bar
              dataKey="valor"
              fill="var(--color-valor)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
