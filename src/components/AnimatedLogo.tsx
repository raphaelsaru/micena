'use client'

import Wave from 'react-wavify'

// Componente do Logo Animado com Onda
export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center space-x-2">
      {/* Logo original com fundo azul */}
      <div className="relative w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
        <span className="text-white font-bold text-sm relative z-10">M</span>
        
        {/* Onda animada por baixo */}
        <div className="absolute inset-0">
        <Wave fill='#02f7f7'
        paused={false}
        style={{ display: 'flex' }}
        options={{
          height: 20,
          amplitude: 15,
          speed: 0.15,
          points: 2
        }}

          />
        </div>
      </div>
      
      <span className="text-sm font-bold text-gray-900">Micena Piscinas</span>
    </div>
  )
}

// Versão compacta para navegação (sem texto)
export function AnimatedLogoIcon() {
  return (
    <div className="relative w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
      <span className="text-white font-bold text-sm relative z-10">M</span>
      
      {/* Onda animada por baixo */}
      <div className="absolute inset-0">
        <Wave
          fill="#60A5FA" // Azul mais claro
          paused={false}
          style={{ 
            display: 'flex',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }}
          options={{
            height: 8,
            amplitude: 6,
            speed: 0.2,
            points: 4
          }}
        />
      </div>
    </div>
  )
}
