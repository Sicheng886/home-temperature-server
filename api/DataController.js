const dayjs = require("dayjs")
const cron = require("node-cron")
const axios = require("axios")
const fsPromise = require("fs").promises
const getCurrentWeather = require("./getCurrentWeather")
const get24HourWeather = require("./get24HourWeather")
const getGPTSuggestion = require("./getGPTSuggestion")
const getWeatherAdvice = require("./getWeatherSuggestion")

function calcArrayToAvg(obj) {
  Object.keys(obj).forEach((key) => {
    const arr = obj[key]
    let sum = 0
    arr.forEach((num) => (sum += num))
    obj[key] = sum / arr.length
  })
}

class DataController {
  constructor() {
    this._currentWeather = {}
    this._forcastWeather = []
    this._sensorData = {}

    this._dailyRange = "0-0"
    this._gptAdvice = "多喝热水！"
    this._hefengAdvice = "多喝热水！"

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
    return this._hefengAdvice
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
      const today = dayjs().date()
      const todayMorningToNightData = todayData
        .map((item) => item.outdoor)
        .concat(
          this._forcastWeather.filter(
            (entry) => dayjs(entry.fxTime).date() === today
          )
        )

      const yesterdayPeriodData = {
        morningT: [],
        noonT: [],
        nightT: [],
        morningH: [],
        noonH: [],
        nightH: [],
      }

      const todayPeriodData = {
        morningT: [],
        noonT: [],
        nightT: [],
        morningH: [],
        noonH: [],
        nightH: [],
      }

      yesterdayData.forEach((item) => {
        const { outdoor, hour } = item
        const temp = parseInt(outdoor.temp)
        const humidity = parseInt(outdoor.humidity)
        const intHour = parseInt(hour)
        if (intHour > 6 && intHour < 11) {
          yesterdayPeriodData.morningT.push(temp)
          yesterdayPeriodData.morningH.push(humidity)
        }
        if (intHour >= 11 && intHour < 15) {
          yesterdayPeriodData.noonT.push(temp)
          yesterdayPeriodData.noonH.push(humidity)
        }
        if (intHour > 17) {
          yesterdayPeriodData.nightT.push(temp)
          yesterdayPeriodData.nightH.push(humidity)
        }
      })

      todayMorningToNightData.forEach((item) => {
        let { fxTime, obsTime, temp, humidity } = item
        temp = parseInt(temp)
        humidity = parseInt(humidity)
        const hour = obsTime ? dayjs(obsTime).hour() : dayjs(fxTime).hour()
        if (hour > 6 && hour < 11) {
          todayPeriodData.morningT.push(temp)
          todayPeriodData.morningH.push(humidity)
        }
        if (hour >= 11 && hour < 15) {
          todayPeriodData.noonT.push(temp)
          todayPeriodData.noonH.push(humidity)
        }
        if (hour > 17) {
          todayPeriodData.nightT.push(temp)
          todayPeriodData.nightH.push(humidity)
        }
      })

      calcArrayToAvg(todayPeriodData)
      calcArrayToAvg(yesterdayPeriodData)

      const periodData = {
        temp: {
          morning: {
            value: todayPeriodData.morningT,
            diff: todayPeriodData.morningT - yesterdayPeriodData.morningT,
          },
          noon: {
            value: todayPeriodData.noonT,
            diff: todayPeriodData.noonT - yesterdayPeriodData.noonT,
          },
          night: {
            value: todayPeriodData.nightT,
            diff: todayPeriodData.noonT - yesterdayPeriodData.noonT,
          },
        },
        humi: {
          morning: {
            value: todayPeriodData.morningH,
            diff: todayPeriodData.morningH - yesterdayPeriodData.morningH,
          },
          noon: {
            value: todayPeriodData.noonH,
            diff: todayPeriodData.noonH - yesterdayPeriodData.noonH,
          },
          night: {
            value: todayPeriodData.nightH,
            diff: todayPeriodData.noonH - yesterdayPeriodData.noonH,
          },
        },
      }

      const formattedData = {
        indoorTemp: [],
        indoorHumidity: [],
        outdoorTemp: [],
        outdoorHumidity: [],
        periodData,
      }
      yesterdayFiltered.concat(todayFiltered).forEach((element) => {
        formattedData.indoorTemp.push(element.indoor.temp)
        formattedData.outdoorTemp.push(element.outdoor.temp)
        formattedData.indoorHumidity.push(element.indoor.humi)
        formattedData.outdoorHumidity.push(element.outdoor.humidity)
      })
      return formattedData
    } catch (err) {
      console.error("yesterday data calc error", err)
      return {
        indoorTemp: [],
        indoorHumidity: [],
        outdoorTemp: [],
        outdoorHumidity: [],
        periodData: {},
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
    return getCurrentWeather()
      .then((data) => {
        this._currentWeather = data
        this._lastWeatherUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
      })
      .catch((err) => console.log(err))
  }
  requestForcastData() {
    return get24HourWeather()
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
    return axios
      .get("http://127.0.0.1:3001")
      .then((res) => {
        this._sensorData = res.data
        this._lastSensorUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
      })
      .catch((err) => console.log(err))
  }
  requestAdvise() {
    return getWeatherAdvice().then((data) => {
      this._hefengAdvice = data
      this._adviceUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
    })
  }
  // requestAdvise() {
  //   const params = {
  //     indoorTemp: this._sensorData.temp,
  //     indoorHumidity: this._sensorData.humi,
  //     outdoorTemp: this._currentWeather.temp,
  //     outdoorHumidity: this._currentWeather.humidity,
  //     dailyRange: this._dailyRange,
  //     weather: this._currentWeather.text,
  //   }
  //   return getGPTSuggestion(params).then((data) => {
  //     this._gptAdvice = data
  //     this._adviceUpdate = dayjs().format("YYYY-MM-DD HH:mm:ss")
  //   })
  // }
  schedual() {
    Promise.all([
      this.requestForcastData(),
      this.requestWeatherData(),
      this.requestSensorData(),
      this.requestAdvise(),
    ]).catch((err) => {
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
