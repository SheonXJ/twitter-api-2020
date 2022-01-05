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

    //使用者加入public Room
    socket.on("public", async (roomName) => {
      //將目前使用者join pubic room
      socket.join(roomName)
      //檢查currentUser是否存在於onlineList
      const checkList = onlineUsers.every(user => user.id !== currentUser.id)
      if (checkList) {
        onlineUsers.push(currentUser)
      }
      //發送目前上線的使用者
      io.to(roomName).emit('loginUsers', onlineUsers)
      //發送使用者進入房間的訊息
      io.to(roomName).emit('loginMsg', `${currentUser.name} has join the ${roomName} Room`)
      //發送之前聊天紀錄
      const allMessage = (await Message.findAll({ 
        raw:true,
        nest:true,
        where: {roomName: 'public'},
        include: {model: User, attributes: ['name', 'avatar']},
        order: [['createdAt', 'DESC']],
        limit: 50,  
      }))
      io.to(roomName).emit("allMessage", allMessage.reverse())
    })

    //接收用戶傳送的訊息
    socket.on("sendMessage", async (msg) => {
      //確保msg資料正確
      if (!msg.content || !msg.UserId || !msg.roomName) {
        return
      }
      //防止用戶傳送空白訊息
      if (msg.content.trim().length === 0) {
        return
      }
      //將使用者send的msg創建於資料庫
      const { content, UserId, roomName } = msg
      const sendMessage = (await Message.create({ content, UserId, roomName }))
      //回傳整理後的msg給front-end
      msg.User = {}
      msg.id = sendMessage.dataValues.id
      msg.User.avatar = currentUser.avatar
      msg.User.createdAt = sendMessage.dataValues.createdAt
      if (msg.roomName === 'public') {
        io.to(roomName).emit("newMessage", msg)
      }
    })

    //接收使用者離開房間
    socket.on("leave-room", (roomName) => {
      socket.leave(roomName)
      //發送使用者離開房間的訊息
      io.to(roomName).emit('logoutMsg', `${currentUser.name} has leave the ${roomName} Room`)
      //發送目前上線的使用者
      onlineUsers = onlineUsers.filter(user => {
        return user.id !== currentUser.id
      })
      io.to(roomName).emit('loginUsers', onlineUsers)
    })

    //當發生離線事件
    socket.on('disconnect', () => {
      //發送目前上線的使用者
      onlineUsers = onlineUsers.filter((user) => {
        return user.id !== currentUser.id;
      });
      io.to("public").emit("loginUsers", onlineUsers);
      //使用者離開所有房間
      socket.leaveAll();
    });
  });
}

module.exports = socket
