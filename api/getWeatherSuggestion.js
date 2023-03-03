const dotenv = require("dotenv")
const axios = require("axios")

dotenv.config()

const getWeatherAdvice = async () => {
  const typeDict = [
    { nane: "穿衣", index: "3" },
    { nane: "舒适度", index: "8" },
    { nane: "感冒", index: "9" },
    { nane: "空调", index: "11" },
  ]
  const key = process.env.API_KEY
  const location = process.env.LOCATION
  const weatherRes = await axios.get(
    `https://devapi.qweather.com/v7/indices/1d?type=${typeDict
      .map((item) => item.index)
      .join(",")}&location=${location}&key=${key}`
  )
  const data = weatherRes.data
  return data.daily
}

module.exports = getWeatherAdvice
