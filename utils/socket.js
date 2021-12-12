const socketio = require('socket.io')
const records = require('../models/chatroom/records')

let onlineCount = 0 //統計線上人數

const socket = server => {
  const io = socketio(server) //socket連接server

  //socket.io 監聽器
  io.on('connection', (socket) => {
    onlineCount++ // 有連線發生時增加人數+1
    io.emit("online", onlineCount) // 發送人數給前端輸出
    socket.emit("maxRecord", records.getMax()) // 新增記錄最大值，用來讓前端網頁知道要放多少筆
    socket.emit("chatRecord", records.get()) // 新增發送紀錄

    socket.on("greet", () => {
      socket.emit("greet", onlineCount);
    })

    socket.on("send", (msg) => {
      // 確認前端傳入的formData，是否包含name和msg
      if (Object.keys(msg).length < 2) return;
      records.push(msg); //將資料透過records判斷是否超過50筆資料
    })

    //當發生離線事件
    socket.on('disconnect', () => {
      //有人離線時onlineCount -1
      onlineCount = (onlineCount < 0) ? 0 : onlineCount -= 1
    });
  });

  // 新增 Records 的事件監聽器
  records.on("new_message", (msg) => {
    // 廣播訊息到聊天室
    io.emit("msg", msg);
  })
}

module.exports = socket