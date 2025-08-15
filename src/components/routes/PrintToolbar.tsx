import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Printer, Palette } from 'lucide-react'

interface PrintToolbarProps {
  onPrint: () => void
  printColor: string
  onPrintColorChange: (color: string) => void
  printColumns: '1' | '2'
  onPrintColumnsChange: (columns: '1' | '2') => void
  printFont: string
  onPrintFontChange: (font: string) => void
  printFontSize: string
  onPrintFontSizeChange: (size: string) => void
}

export function PrintToolbar({
  onPrint,
  printColor,
  onPrintColorChange,
  printColumns,
  onPrintColumnsChange,
  printFont,
  onPrintFontChange,
  printFontSize,
  onPrintFontSizeChange
}: PrintToolbarProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Configurações de Impressão</h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Color Picker */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="print-color" className="text-sm font-medium text-gray-700 flex items-center">
              <Palette className="w-4 h-4 mr-1" />
              Cor:
            </Label>
            <input
              id="print-color"
              type="color"
              value={printColor}
              onChange={(e) => onPrintColorChange(e.target.value)}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              title="Escolher cor para impressão"
            />
          </div>

          {/* Select de Colunas */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="print-columns" className="text-sm font-medium text-gray-700">
              Colunas:
            </Label>
            <Select value={printColumns} onValueChange={(value: '1' | '2') => onPrintColumnsChange(value)}>
              <SelectTrigger id="print-columns" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select de Fonte */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="print-font" className="text-sm font-medium text-gray-700">
              Fonte:
            </Label>
            <Select value={printFont} onValueChange={onPrintFontChange}>
              <SelectTrigger id="print-font" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system-ui">System UI</SelectItem>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select de Tamanho da Fonte */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="print-font-size" className="text-sm font-medium text-gray-700">
              Tamanho:
            </Label>
            <Select value={printFontSize} onValueChange={onPrintFontSizeChange}>
              <SelectTrigger id="print-font-size" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10pt">10pt</SelectItem>
                <SelectItem value="12pt">12pt</SelectItem>
                <SelectItem value="14pt">14pt</SelectItem>
                <SelectItem value="16pt">16pt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão Imprimir */}
        <Button
          onClick={onPrint}
          className="bg-blue-600 hover:bg-blue-700 text-white print:hidden"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
