const dayjs = require("dayjs")
const cron = require("node-cron")
const axios = require("axios")
const fsPromise = require("fs").promises
const getCurrentWeather = require("./getCurrentWeather")
const get24HourWeather = require("./get24HourWeather")
const getGPTSuggestion = require("./getGPTSuggestion")

class DataController {
  constructor() {
    this._currentWeather = {}
    this._forcastWeather = []
    this._sensorData = {}

    this._dailyRange = "0-0"
    this._gptAdvice = "多喝热水！"

    this._lastWeatherUpdate = "1970-01-01 00:00:00"
    this._lastForcastUpdate = "1970-01-01 00:00:00"
    this._lastSensorUpdate = "1970-01-01 00:00:00"
    this._adviceUpdate = "1970-01-01 00:00:00"
  }
  get current() {
    return this._currentWeather
  }
  get forcast() {
    return this._forcastWeather
  }
  get sensor() {
    return this._sensorData
  }
  get gptAdvice() {
    return this._gptAdvice
  }
  get updateInformation() {
    return `current weather updated on ${this._lastWeatherUpdate} \n forcast weather update on ${this._lastForcastUpdate} \n sensor data update on ${this._lastSensorUpdate} \n advise gpt data updated on ${this._adviceUpdate}`
  }

  async getYesterdayData() {
    try {
      const yesterdayFile = await fsPromise.readFile(
        `${__dirname}/../data/${dayjs()
          .subtract(1, "day")
          .format("YYYY-MM-DD")}.json`,
        "utf-8"
      )
      const todayFile = await fsPromise.readFile(
        `${__dirname}/../data/${dayjs().format("YYYY-MM-DD")}.json`,
        "utf-8"
      )
      const yesterdayData = JSON.parse(yesterdayFile)
      const todayData = JSON.parse(todayFile)
      const currentHour = dayjs().format("HH")
      const yesterdayFiltered = yesterdayData.filter(
        (entry) => parseInt(entry.hour) > parseInt(currentHour)
      )
      const todayFiltered = todayData.filter(
        (entry) => parseInt(entry.hour) <= parseInt(currentHour)
      )

      const formattedData = {
        indoorTemp: [],
        indoorHumidity: [],
        outdoorTemp: [],
        outdoorHumidity: [],
      }
      yesterdayFiltered.concat(todayFiltered).forEach((element) => {
        formattedData.indoorTemp.push(element.indoor.temp)
        formattedData.outdoorTemp.push(element.outdoor.temp)
        formattedData.indoorHumidity.push(element.indoor.humi)
        formattedData.outdoorHumidity.push(element.outdoor.humidity)
      })
      return formattedData
    } catch (err) {
      console.error("no yesterday data")
      return {
        indoorTemp: [],
        indoorHumidity: [],
        outdoorTemp: [],
        outdoorHumidity: [],
      }
    }
  }
  async wrtieTodayData() {
    try {
      const today = dayjs()
      const fileList = await fsPromise.readdir(__dirname + "/../data")
      const todayFilename = `${today.format("YYYY-MM-DD")}.json`
      let previousData = []
      if (fileList.some((name) => name === todayFilename)) {
        const todayFile = await fsPromise.readFile(
          `${__dirname}/../data/${today.format("YYYY-MM-DD")}.json`,
          "utf-8"
        )
        previousData = JSON.parse(todayFile)
      }
      const hourlyData = {
        hour: today.format("HH"),
        indoor: this._sensorData,
        outdoor: this._currentWeather,
      }
      previousData.push(hourlyData)
      fsPromise.writeFile(
        `${__dirname}/../data/${today.format("YYYY-MM-DD")}.json`,
        JSON.stringify(previousData),
        "utf-8"
      )
    } catch (err) {
      console.log("write file failed", err)
    }
  }
  requestWeatherData() {
    getCurrentWeather()
      .then((data) => {
        this._currentWeather = data
        this._lastWeatherUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
      })
      .catch((err) => console.log(err))
  }
  requestForcastData() {
    get24HourWeather()
      .then((data) => {
        this._forcastWeather = data
        this._lastForcastUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
        this._dailyRange = `${Math.min(
          ...data.map((item) => item.temp)
        )}-${Math.max(...data.map((item) => item.temp))}`
      })
      .catch((err) => console.log(err))
  }
  requestSensorData() {
    axios
      .get("http://127.0.0.1:3001")
      .then((res) => {
        this._sensorData = res.data
        this._lastSensorUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
      })
      .catch((err) => console.log(err))
  }
  requestAdvise() {
    const params = {
      indoorTemp: this._sensorData.temp,
      indoorHumidity: this._sensorData.humi,
      outdoorTemp: this._currentWeather.temp,
      outdoorHumidity: this._currentWeather.humidity,
      dailyRange: this._dailyRange,
      weather: this._currentWeather.text,
    }
    getGPTSuggestion(params).then((data) => {
      this._gptAdvice = data
      this._adviceUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
    })
  }
  schedual() {
    Promise.all([
      this.requestForcastData(),
      this.requestWeatherData(),
      this.requestSensorData(),
    ])
      .then(() => {
        this.requestAdvise()
      })
      .catch((err) => {
        console.log(err)
      })

    cron.schedule("*/10 * * * *", () => {
      this.requestWeatherData()
    })
    cron.schedule("0 * * * *", () => {
      this.requestForcastData()
    })
    cron.schedule("*/1 * * * *", () => {
      this.requestSensorData()
    })

    cron.schedule("2 * * * *", () => {
      this.wrtieTodayData()
    })

    cron.schedule("1 */6 * * *", () => {
      this.requestAdvise()
    })
  }
}

module.exports = DataController
