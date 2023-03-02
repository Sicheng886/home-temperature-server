const dict = {
  bowie: "最好的波居老师",
  郭晓莹: "最好的波居老师",
  最好的波居老师: "最好的波居老师",
  波居: "最好的波居老师",
  wally: "杨工",
  杨工: "杨工",
}
const loveTalk = [
  "欢迎光临杨工的211，你要多来",
  "今天也要记得多喝热水！",
  "是时候一起速速上菜了！",
  "今晚想吃啥？速来私聊",
  "爱你爱你，出示本条回复可以获得爱心奶茶一杯",
]
const generalReply = [
  "喜欢您来！",
  "随便看看呢",
  "你好，每日回复由GPT提供，仅供供参考",
]
const welcome = (name) => {
  const answer = {
    nickName: "Guest",
    content: "喜欢您来！",
  }
  if (dict[name]) {
    answer.nickName = dict[name]
    if (answer.nickName === "最好的波居老师") {
      answer.content = loveTalk[Math.floor(Math.random() * loveTalk.length)]
    }
  } else if (name) {
    answer.nickName = name
    answer.content =
      generalReply[Math.floor(Math.random() * generalReply.length)]
  }
  return answer
}

module.exports = welcome
