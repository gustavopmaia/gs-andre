import axios from 'axios'

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export async function pegarDadosClimaticos() {
  const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive'

  const params = {
    latitude: -23.55052,
    longitude: -46.633308,
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 7 dias atrás
    end_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // hoje
    daily: ['precipitation_sum', 'temperature_2m_max', 'temperature_2m_min'].join(','),
    timezone: 'America/Sao_Paulo',
  }

  const url = `${BASE_URL}?latitude=${params.latitude}&longitude=${params.longitude}&start_date=${params.start_date}&end_date=${params.end_date}&daily=${params.daily}&timezone=${params.timezone}`

  const response = await axios.get(url)
  return response.data
}

export async function pegarDadosAtuais() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=-23.55052&longitude=-46.633308&current_weather=true&timezone=America/Sao_Paulo`
  const response = await axios.get(url)
  return response.data.current_weather
}

export async function pegarPrevisaoFutura() {
  const params = {
    latitude: -23.55052,
    longitude: -46.633308,
    start_date: new Date().toISOString().slice(0, 10), // hoje
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 7 dias à frente
    daily: ['precipitation_sum', 'temperature_2m_max', 'temperature_2m_min'].join(','),
    timezone: 'America/Sao_Paulo',
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`

  const response = await axios.get(url)
  return response.data
}
