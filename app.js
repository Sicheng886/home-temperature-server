const express = require("express")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const cors = require("cors")
const DataController = require("./api/DataController")
const welcome = require("./api/welcome")
const createLogin = require("./api/createLogin")

const app = express()
const dataController = new DataController()
dataController.schedual()

app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())
app.use(express.json())

app.get("/api/weather", (req, res) => {
  const data = dataController.current
  res.send(JSON.stringify(data))
})
app.get("/api/forcast", (req, res) => {
  const data = dataController.forcast
  res.send(JSON.stringify(data))
})

app.get("/api/get-sensor", (req, res) => {
  const sensorRes = dataController.sensor
  res.send(JSON.stringify(sensorRes))
})
app.get("/api/updateTime", (req, res) => {
  const data = dataController.updateInformation
  res.send(data)
})
app.get("/api/advise", (req, res) => {
  const data = dataController.gptAdvice
  res.send(data)
})

app.get("/api/history", async (req, res) => {
  const data = await dataController.getYesterdayData()
  res.send(data)
})

app.post("/api/welcome", (req, res) => {
  const { name } = JSON.parse(req.body.body)
  console.log(name, req.body)
  const answer = welcome(name)
  createLogin(name, req.ip)
  res.json(answer)
})

app.get("/api/all", async (req, res) => {
  const history = await dataController.getYesterdayData()
  const data = {
    current: dataController.current,
    forcast: dataController.forcast,
    sensor: dataController.sensor,
    advise: dataController.gptAdvice,
    history,
  }
  res.json(data)
})

app.get("/manual/adivse", async (req, res) => {
  await dataController.requestAdvise()
  res.send("request successd")
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(() => {
    res.status(404).json("error")
  })
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get("env") === "development" ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json({ err })
})

module.exports = app
