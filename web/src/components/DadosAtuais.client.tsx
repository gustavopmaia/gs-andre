'use client'

import React, { useEffect, useState } from 'react'

interface DadosAtuais {
  time: string
  temperature: number
  precipitation?: number
  windspeed: number
  winddirection: number
}

function DadosAtuais() {
  const [dados, setDados] = useState<DadosAtuais | null>(null)

  useEffect(() => {
    const fetchDados = () => {
      fetch('http://localhost:3001/dados-atuais')
        .then((res) => res.json())
        .then(setDados)
        .catch(() => setDados(null))
    }

    fetchDados()
    const intervalo = setInterval(fetchDados, 60000)

    return () => clearInterval(intervalo)
  }, [])

  if (!dados) return <p>Dados atuais indisponíveis.</p>

  return (
    <ul>
      <li>
        <strong>Hora:</strong> {dados.time}
      </li>
      <li>
        <strong>Temperatura:</strong> {dados.temperature} °C
      </li>
      <li>
        <strong>Precipitação:</strong> {dados.precipitation ?? 0} mm
      </li>
      <li>
        <strong>Vento:</strong> {dados.windspeed} km/h, {dados.winddirection}°
      </li>
    </ul>
  )
}

export default DadosAtuais
