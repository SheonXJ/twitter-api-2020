const socketio = require('socket.io')
const { socketAuthenticated } = require('../middleware/auth')
const { Message } = require('../models')

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
    }
  }) 

  //socket.io 監聽器
  io.use(socketAuthenticated).on('connection', (socket) => {
    const currentUser = socket.user
    console.log(`currentUser: ${socket.user.name}`)
    // 有連線發生時增加人數+1
    onlineCount++ 

    // 使用者加入public Room
    socket.on("public", user => {
      socket.join("public")
      io.emit('loginMsg', `${currentUser.name} has join the public Room`)
    })

    // 發送人數給前端輸出
    io.emit("online", onlineCount) 

    // 發送之前聊天紀錄
    socket.emit("allMessage", data)

    // 接收用戶傳送的訊息
    socket.on("sendMessage", async (msg) => {
      if (!msg.content || !msg.UserId || !msg.roomName) {
        return
      }
      const { content, UserId, roomName } = msg
      const message = (await Message.create({ content, UserId, roomName }))
      io.emit("newMessage", msg)
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