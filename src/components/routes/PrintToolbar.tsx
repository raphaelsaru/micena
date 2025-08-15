import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer } from 'lucide-react'

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
    <div className="bg-white rounded-lg border border-gray-200 p-4 print:hidden">
      <div className="flex flex-wrap items-center gap-4">
        {/* Seletor de cor */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="print-color" className="text-sm font-medium text-gray-700">
            Cor:
          </Label>
          <input
            id="print-color"
            type="color"
            value={printColor}
            onChange={(e) => onPrintColorChange(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            title="Escolher cor para impressão"
          />
        </div>

        {/* Seletor de colunas */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="print-columns" className="text-sm font-medium text-gray-700">
            Colunas:
          </Label>
          <Select value={printColumns} onValueChange={(value: '1' | '2') => onPrintColumnsChange(value)}>
            <SelectTrigger id="print-columns" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Coluna</SelectItem>
              <SelectItem value="2">2 Colunas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de fonte */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="print-font" className="text-sm font-medium text-gray-700">
            Fonte:
          </Label>
          <Select value={printFont} onValueChange={(value: string) => onPrintFontChange(value)}>
            <SelectTrigger id="print-font" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system-ui">
                <span style={{ fontFamily: 'system-ui' }}>System UI</span>
              </SelectItem>
              <SelectItem value="Inter">
                <span style={{ fontFamily: 'Inter' }}>Inter</span>
              </SelectItem>
              <SelectItem value="Roboto">
                <span style={{ fontFamily: 'Roboto' }}>Roboto</span>
              </SelectItem>
              <SelectItem value="serif">
                <span style={{ fontFamily: 'serif' }}>Serif</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de tamanho da fonte */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="print-font-size" className="text-sm font-medium text-gray-700">
            Tamanho:
          </Label>
          <Select value={printFontSize} onValueChange={(value: string) => onPrintFontSizeChange(value)}>
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

        {/* Botão de impressão */}
        <Button
          onClick={onPrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
