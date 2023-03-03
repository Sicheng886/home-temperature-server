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
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: generatePrompt({
            indoorTemp,
            indoorHumidity,
            outdoorTemp,
            outdoorHumidity,
            dailyRange,
            weather,
          }),
        },
      ],
      temperature: 0.6,
      max_tokens: 400,
    })
    console.log(completion.data.choices[0].message.content)
    return completion.data.choices[0].message.content
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data)
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`)
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
  return `请基于后面的室内温度、湿度，室外温度、湿度以及天气给出综合性的生活建议。室内温度${indoorTemp}，室内湿度${indoorHumidity}，室外温度${outdoorTemp}，室外湿度${outdoorHumidity}，全天温度${dailyRange}，天气${weather}。`
}
module.exports = getGPTSuggestion
