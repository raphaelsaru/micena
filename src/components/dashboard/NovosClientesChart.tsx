"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { NovosClientesMes } from "@/lib/dashboard"

interface NovosClientesChartProps {
  data: NovosClientesMes[]
}

export function NovosClientesChart({ data }: NovosClientesChartProps) {
  const chartConfig = {
    quantidade: {
      label: "Novos Clientes",
      color: "#10b981"
    }
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Novos Clientes por Mês (Últimos 6 Meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="mes" 
              tickFormatter={(value) => value}
            />
            <YAxis />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [value, 'Novos Clientes']}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="quantidade"
              stroke="var(--color-quantidade)"
              strokeWidth={3}
              dot={{ fill: 'var(--color-quantidade)', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: 'var(--color-quantidade)', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
