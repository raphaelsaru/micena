"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
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

// Componente customizado para o tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ReceitaMensal
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <div className="font-medium text-foreground">{data.mes}</div>
        <div className="text-sm text-muted-foreground space-y-1 mt-2">
          <div>Total: {formatCurrency(data.valor)}</div>
          <div>OS: {formatCurrency(data.valorOS)}</div>
          <div>Mensalistas: {formatCurrency(data.valorMensalistas)}</div>
        </div>
      </div>
    )
  }
  return null
}

export function ReceitaMensalChart({ data }: ReceitaMensalChartProps) {
  const chartConfig = {
    valor: {
      label: "Receita Total",
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
            <Tooltip content={<CustomTooltip />} />
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
