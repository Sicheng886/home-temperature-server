const fs = require("fs")
const welcome = (name) => {
  const answer = {
    nickName: "Guest",
    content: "喜欢您来！",
  }

  const repliesFile = fs.readFileSync(
    `${__dirname}/../data/replies.json`,
    "utf-8"
  )
  const replies = JSON.parse(repliesFile)

  if (replies.dict[name]) {
    answer.nickName = replies.dict[name]
    if (answer.nickName === "最好的波居老师") {
      answer.content =
        replies.loveTalk[Math.floor(Math.random() * replies.loveTalk.length)]
    }
  } else if (name) {
    answer.nickName = name
    answer.content =
      replies.generalReply[
        Math.floor(Math.random() * replies.generalReply.length)
      ]
  }
  return answer
}

module.exports = welcome
