const socketio = require('socket.io')
const { socketAuthenticated } = require('../middleware/auth')

let data = []
let MAX = 10
let onlineCount = 0 //統計線上人數

const socket = server => {
  //socket連接server,設定CORS
  const io = socketio(server, {
    cors: {
      origin: [
        'http://localhost:8080',
        'https://jackjackhuo.github.io'
      ],
      methods: ["GET", "POST"],
      transports: ['websocket', 'polling'],
    }
  }) 

  //socket.io 監聽器
  io.use(socketAuthenticated).on('connection', (socket) => {
    console.log(`currentUser: ${socket.user}`)
    // onlineCount++ // 有連線發生時增加人數+1
    io.emit("online", onlineCount) // 發送人數給前端輸出
    // socket.emit("maxRecord", records.getMax()) // 新增記錄最大值，用來讓前端網頁知道要放多少筆
    socket.emit("allMessage", data) // 發送之前聊天紀錄

    // socket.on("greet", () => {
    //   socket.emit("greet", onlineCount);
    // })

    socket.on("sendMessage", (msg) => {
      // 確認前端傳入的formData，是否包含name和msg
      if (Object.keys(msg).length < 2) return
      //將msg儲存於data array
      data.push(msg)
      //確認data array是否超過最大筆數
      if (data.length > MAX) {
        data.splice(0, 1)
      }
      socket.emit("newMessage", msg)
    })

    //當發生離線事件
    socket.on('disconnect', () => {
      //有人離線時onlineCount -1
      onlineCount = (onlineCount < 0) ? 0 : onlineCount -= 1
    });
  });

  // // 新增 Records 的事件監聽器
  // records.on("new_message", (msg) => {
  //   // 廣播訊息到聊天室
  //   io.emit("msg", msg);
  // })
}

module.exports = socket