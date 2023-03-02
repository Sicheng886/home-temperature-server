const fsPromise = require("fs").promises
const dayjs = require("dayjs")

const createLogin = async (name, ip) => {
  try {
    const file = await fsPromise.readFile(
      `${__dirname}/../data/loginRecord.json`,
      "utf-8"
    )
    const loginRecord = JSON.parse(file)
    loginRecord.push({ name, ip, time: dayjs().format("YYYY/MM/DD-HH:mm:ss") })
    fsPromise.writeFile(
      `${__dirname}/../data/loginRecord.json`,
      JSON.stringify(loginRecord),
      "utf-8"
    )
  } catch (err) {
    console.log(err)
  }
}

module.exports = createLogin
