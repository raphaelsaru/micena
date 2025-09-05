import fs from 'fs'
import path from 'path'

/**
 * Converte uma imagem do diretório public para base64
 * @param imagePath - Caminho da imagem relativo ao diretório public
 * @returns String base64 da imagem
 */
export function imageToBase64(imagePath: string): string {
  try {
    const publicPath = path.join(process.cwd(), 'public', imagePath)
    const imageBuffer = fs.readFileSync(publicPath)
    const mimeType = getMimeType(imagePath)
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
  } catch (error) {
    console.error(`Erro ao converter imagem ${imagePath} para base64:`, error)
    return ''
  }
}

/**
 * Determina o tipo MIME baseado na extensão do arquivo
 * @param filePath - Caminho do arquivo
 * @returns Tipo MIME
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

/**
 * Obtém as imagens de assinatura em base64
 * @returns Objeto com as imagens de assinatura em base64
 */
export function getSignatureImagesBase64() {
  return {
    companySignature: imageToBase64('assinatura_empresa.png'),
    blankSignature: imageToBase64('blank_signature.png')
  }
}
