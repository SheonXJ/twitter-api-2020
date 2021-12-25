const socketio = require('socket.io')
const { socketAuthenticated } = require('../middleware/auth')
const { Message, User } = require('../models')

let onlineUsers = []

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

    // 使用者加入public Room
    socket.on("public", async (data) => {
      //將目前使用者join pubic room
      socket.join("public")
      //將currentUser 存入 data array
      io.emit('loginMsg', `${currentUser.name} has join the public Room`)
      io.emit('loginUsers', data)
      // 發送之前聊天紀錄
      const allMessage = (await Message.findAll({ 
        raw:true,
        nest:true, 
        where: {roomName: 'public'},
        include: {model: User, attributes: ['name', 'avatar']},
        order: [['createdAt', 'ASC']],
        limit: 50,
      }))
      socket.emit("allMessage", allMessage)
    })

    // 發送人數給前端輸出
    io.emit("online", onlineCount) 

    // 接收用戶傳送的訊息
    socket.on("sendMessage", async (msg) => {
      if (!msg.content || !msg.UserId || !msg.roomName) {
        return
      }
      const { content, UserId, roomName } = msg
      const sendMessage = (await Message.create({ content, UserId, roomName }))
      msg.id = sendMessage.dataValues.id
      msg.avatar = currentUser.avatar
      msg.createdAt = sendMessage.dataValues.createdAt
      io.to("public").emit("newMessage", msg)
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