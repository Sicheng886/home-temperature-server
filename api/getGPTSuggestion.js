const { Configuration, OpenAIApi } = require("openai")

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

async function getGPTSuggestion({
  indoorTemp,
  indoorHumidity,
  outdoorTemp,
  outdoorHumidity,
  dailyRange,
  weather,
}) {
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt({
        indoorTemp,
        indoorHumidity,
        outdoorTemp,
        outdoorHumidity,
        dailyRange,
        weather,
      }),
      temperature: 0.6,
      max_tokens: 600,
    })
    console.log(completion.data.choices[0].text)
    return completion.data.choices[0].text
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data)
      res.status(error.response.status).json(error.response.data)
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`)
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      })
    }
  }
}

function generatePrompt({
  indoorTemp,
  indoorHumidity,
  outdoorTemp,
  outdoorHumidity,
  dailyRange,
  weather,
}) {
  return `请基于下面输入的室内温度、湿度，室外温度、湿度以及天气给出生活建议。室内温度${indoorTemp}，室内湿度${indoorHumidity}，室外温度${outdoorTemp}，室外湿度${outdoorHumidity}，全天温度${dailyRange}，天气${weather}。
  建议：
`
}
module.exports = getGPTSuggestion
