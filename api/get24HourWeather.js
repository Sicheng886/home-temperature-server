const dotenv = require("dotenv")
const axios = require("axios")

dotenv.config()

const get24HourWeather = async () => {
  const key = process.env.API_KEY
  const location = process.env.LOCATION
  const weatherRes = await axios.get(
    `https://devapi.qweather.com/v7/weather/24h?location=${location}&key=${key}`
  )
  const data = weatherRes.data
  return data.hourly
}

module.exports = get24HourWeather
