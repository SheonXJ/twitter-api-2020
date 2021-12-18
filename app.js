//require packages
const express = require('express')
const helpers = require('./_helpers')
const passport = require('./config/passport')
const bodyParser = require('body-parser')
const cors = require('cors')
//set express serve
const app = express()
const port = process.env.PORT || 3000
//set socket.io serve
const server = require('http').Server(app)

//載入環境變數
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

//middleware
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(passport.initialize())
app.use(cors())
require('./models')
require('./routes')(app)
require('./utils/socket')(server) //載入socket並開啟server通道

//routes
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/chatroom.html')
// })

//run serve
server.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app
