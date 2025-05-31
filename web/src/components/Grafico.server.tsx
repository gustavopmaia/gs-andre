'use server'

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  dados: { data: string; [key: string]: number }[]
  linhas: { key: string; cor: string; label: string }[]
}

function Grafico({ dados, linhas }: Props) {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <LineChart data={dados}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis dataKey='data' />
        <YAxis />
        <Tooltip />
        <Legend />
        {linhas.map((l) => (
          <Line key={l.key} type='monotone' dataKey={l.key} stroke={l.cor} name={l.label} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default Grafico
