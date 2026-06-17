'use client'

const MAX_DIMENSION = 80
const MIN_DIMENSION = 40
const MAX_OUTPUT_LENGTH = 36_000
const MAX_DATABASE_LENGTH = 131_072
const QUALITY_STEPS = [0.72, 0.6, 0.48]
const FORMATS = ['image/webp', 'image/jpeg'] as const

export type BuiltInNetworkingCategoryIcon = {
  value: 'internet' | 'wifi' | 'router' | 'fiber' | 'cable-tv' | 'iptv' | 'phone' | 'server' | 'combo'
  label: string
  colors: [string, string]
  path: string
}

export const builtInNetworkingCategoryIcons: BuiltInNetworkingCategoryIcon[] = [
  {
    value: 'internet',
    label: 'Internet',
    colors: ['#0f9f6e', '#075985'],
    path: 'M9.208 12.346c-.485 1-.953 1.154-1.208 1.154s-.723-.154-1.208-1.154c-.372-.768-.647-1.858-.749-3.187a21 21 0 0 0 3.914 0c-.102 1.329-.377 2.419-.75 3.187m.788-4.699C9.358 7.714 8.69 7.75 8 7.75s-1.358-.036-1.996-.103c.037-1.696.343-3.075.788-3.993C7.277 2.654 7.745 2.5 8 2.5s.723.154 1.208 1.154c.445.918.75 2.297.788 3.993m1.478 1.306c-.085 1.516-.375 2.848-.836 3.874a5.5 5.5 0 0 0 2.843-4.364c-.621.199-1.295.364-2.007.49m1.918-2.043c-.572.204-1.21.379-1.901.514-.056-1.671-.354-3.14-.853-4.251a5.5 5.5 0 0 1 2.754 3.737m-8.883.514c.056-1.671.354-3.14.853-4.251A5.5 5.5 0 0 0 2.608 6.91c.572.204 1.21.379 1.901.514M2.52 8.463a5.5 5.5 0 0 0 2.843 4.364c-.46-1.026-.75-2.358-.836-3.874a15.5 15.5 0 0 1-2.007-.49M15 8A7 7 0 1 0 1 8a7 7 0 0 0 14 0',
  },
  {
    value: 'wifi',
    label: 'Wi-Fi',
    colors: ['#0284c7', '#0f766e'],
    path: 'M3.261 2.186c.337-.274.829-.154 1.044.223.197.344.09.777-.21 1.035A5.99 5.99 0 0 0 2 8a5.99 5.99 0 0 0 2.095 4.556c.3.258.407.69.21 1.034-.215.378-.707.498-1.044.223A7.49 7.49 0 0 1 .5 8a7.49 7.49 0 0 1 2.761-5.814m8.434.223c-.197.344-.09.777.21 1.035A5.99 5.99 0 0 1 14 8a5.99 5.99 0 0 1-2.095 4.556c-.3.258-.407.69-.21 1.034.215.378.707.498 1.044.223A7.49 7.49 0 0 0 15.5 8a7.49 7.49 0 0 0-2.761-5.814c-.337-.274-.829-.154-1.044.223M4.759 4.878c.315-.327.837-.21 1.062.184.19.33.097.744-.144 1.04A3 3 0 0 0 5 8c0 .72.254 1.381.677 1.898.241.296.333.71.144 1.04-.225.394-.747.511-1.062.184A4.5 4.5 0 0 1 3.5 8c0-1.213.48-2.313 1.26-3.122m5.42.184c-.19.33-.098.744.144 1.04C10.746 6.618 11 7.28 11 8s-.254 1.381-.677 1.898c-.242.296-.333.71-.144 1.04.225.394.747.511 1.062.184A4.5 4.5 0 0 0 12.5 8c0-1.213-.48-2.313-1.26-3.122-.314-.327-.836-.21-1.061.184M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  },
  {
    value: 'router',
    label: 'Router',
    colors: ['#2563eb', '#1e293b'],
    path: 'M5.56 4.403c.27.314.223.784-.015 1.123A3 3 0 0 0 5 7.25c0 .642.202 1.237.545 1.724.238.339.284.809.015 1.123-.27.315-.75.354-1.015.036A4.48 4.48 0 0 1 3.5 7.25c0-1.097.393-2.102 1.045-2.883.266-.318.745-.279 1.015.036m4.88 0c-.27.314-.223.784.015 1.123.344.487.545 1.082.545 1.724s-.201 1.237-.545 1.724c-.238.339-.284.809-.015 1.123.27.315.75.354 1.015.036A4.48 4.48 0 0 0 12.5 7.25a4.48 4.48 0 0 0-1.045-2.883c-.265-.318-.745-.279-1.015.036m1.953-2.278c-.27.315-.23.785.05 1.092A5.98 5.98 0 0 1 14 7.25c0 1.553-.59 2.968-1.558 4.033-.278.307-.319.777-.05 1.092.27.314.747.353 1.033.053A7.47 7.47 0 0 0 15.5 7.25c0-2.008-.79-3.832-2.075-5.178-.286-.3-.763-.261-1.032.053m-8.786 0c-.27-.314-.746-.353-1.032-.053A7.48 7.48 0 0 0 .5 7.25c0 2.008.79 3.832 2.075 5.178.286.3.763.261 1.032-.053.27-.315.23-.785-.05-1.092A5.98 5.98 0 0 1 2 7.25c0-1.553.59-2.968 1.558-4.033.278-.307.319-.777.05-1.092M8.75 8.55a1.5 1.5 0 1 0-1.5 0v5.701a.75.75 0 0 0 1.5 0z',
  },
  {
    value: 'fiber',
    label: 'Fiber',
    colors: ['#ea580c', '#0891b2'],
    path: 'M12.442 13.033c-.278.307-.319.777-.05 1.092.27.314.747.353 1.033.053a7.5 7.5 0 1 0-10.85 0c.286.3.763.261 1.032-.053.27-.315.23-.785-.05-1.092a6 6 0 1 1 8.884 0m-.987-1.15c-.265.318-.745.279-1.015-.036-.27-.314-.223-.784.015-1.123a3 3 0 1 0-4.91 0c.238.339.284.809.015 1.123-.27.315-.75.354-1.015.036a4.5 4.5 0 1 1 6.91 0M8 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  },
  {
    value: 'cable-tv',
    label: 'Cable TV',
    colors: ['#334155', '#0284c7'],
    path: 'M3 3.5h10A1.5 1.5 0 0 1 14.5 5v5a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 10V5A1.5 1.5 0 0 1 3 3.5m-.21 9.493A3 3 0 0 1 0 10V5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5a3 3 0 0 1-2.79 2.993l.46.922a.75.75 0 1 1-1.34.67L11.536 13H4.464l-.793 1.585a.75.75 0 1 1-1.342-.67z',
  },
  {
    value: 'iptv',
    label: 'IPTV',
    colors: ['#16a34a', '#0f766e'],
    path: 'M3 3.5h10A1.5 1.5 0 0 1 14.5 5v5a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 10V5A1.5 1.5 0 0 1 3 3.5m-.21 9.493A3 3 0 0 1 0 10V5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5a3 3 0 0 1-2.79 2.993l.46.922a.75.75 0 1 1-1.34.67L11.536 13H4.464l-.793 1.585a.75.75 0 1 1-1.342-.67z',
  },
  {
    value: 'phone',
    label: 'Phone',
    colors: ['#7c3aed', '#0f172a'],
    path: 'M12 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 12.5v-9A1.5 1.5 0 0 1 5.5 2h5A1.5 1.5 0 0 1 12 3.5m-1.5-3a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3zM6.25 11a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5z',
  },
  {
    value: 'server',
    label: 'Server',
    colors: ['#475569', '#0f172a'],
    path: 'M4 3.5h8A1.5 1.5 0 0 1 13.5 5v2.25h-11V5A1.5 1.5 0 0 1 4 3.5M2.5 8.75V11A1.5 1.5 0 0 0 4 12.5h8a1.5 1.5 0 0 0 1.5-1.5V8.75zM1 5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3zm2.75.5a.75.75 0 0 1 .75-.75H7a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75m.75 4.25a.75.75 0 0 0 0 1.5H7a.75.75 0 0 0 0-1.5z',
  },
  {
    value: 'combo',
    label: 'Cloud',
    colors: ['#dc2626', '#2563eb'],
    path: 'M4.5 6.25a3.25 3.25 0 0 1 6.051-1.65 4.5 4.5 0 0 0-2.35 1.34A.75.75 0 0 0 9.3 6.96a3 3 0 0 1 2.3-.958A3 3 0 0 1 11.5 12H3.75a2.25 2.25 0 0 1-.002-4.5h.03a.75.75 0 0 0 .747-.843A3 3 0 0 1 4.5 6.25M7.75 1.5a4.75 4.75 0 0 0-4.747 4.574A3.751 3.751 0 0 0 3.75 13.5h7.75a4.5 4.5 0 0 0 .687-8.948A4.75 4.75 0 0 0 7.75 1.5',
  },
]

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to read the selected image.'))
    image.src = source
  })

const drawImageToCanvas = (
  image: HTMLImageElement,
  width: number,
  height: number,
) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to prepare the image canvas.')
  }

  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return canvas
}

const drawIconGlyph = (
  context: CanvasRenderingContext2D,
  icon: BuiltInNetworkingCategoryIcon,
) => {
  const path = new Path2D(icon.path)

  context.save()
  context.translate(16, 16)
  context.scale(3, 3)
  context.fillStyle = '#ffffff'
  context.fill(path, 'evenodd')
  context.restore()
}

export function createBuiltInCategoryIconDataUrl(icon: BuiltInNetworkingCategoryIcon) {
  const size = MAX_DIMENSION
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to prepare the icon canvas.')
  }

  const gradient = context.createLinearGradient(12, 8, 68, 72)
  gradient.addColorStop(0, icon.colors[0])
  gradient.addColorStop(1, icon.colors[1])

  context.fillStyle = gradient
  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 0.18
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(24, 18, 20, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  drawIconGlyph(context, icon)

  return canvas.toDataURL('image/webp', 0.72)
}

export async function compressCategoryIcon(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.readAsDataURL(file)
  })

  const image = await loadImage(source)
  const largestSide = Math.max(image.width, image.height) || 1
  let width = Math.max(
    MIN_DIMENSION,
    Math.round((image.width / largestSide) * MAX_DIMENSION) || MIN_DIMENSION,
  )
  let height = Math.max(
    MIN_DIMENSION,
    Math.round((image.height / largestSide) * MAX_DIMENSION) || MIN_DIMENSION,
  )

  let smallestResult = source

  while (width >= MIN_DIMENSION && height >= MIN_DIMENSION) {
    const canvas = drawImageToCanvas(image, width, height)

    for (const format of FORMATS) {
      for (const quality of QUALITY_STEPS) {
        const result = canvas.toDataURL(format, quality)

        if (result.length < smallestResult.length) {
          smallestResult = result
        }

        if (result.length <= MAX_OUTPUT_LENGTH) {
          return result
        }
      }
    }

    width = Math.max(MIN_DIMENSION, Math.round(width * 0.84))
    height = Math.max(MIN_DIMENSION, Math.round(height * 0.84))

    if (width === MIN_DIMENSION && height === MIN_DIMENSION) {
      break
    }
  }

  if (smallestResult.length > MAX_DATABASE_LENGTH) {
    throw new Error('Choose a smaller icon image.')
  }

  return smallestResult
}
