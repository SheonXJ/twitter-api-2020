const passport = require('../config/passport')
const helper = require('../_helpers')
const { User } = require('../models')
const jwt = require('jsonwebtoken')

module.exports = {
  authenticated: (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (!user) {
        return res
          .status(401)
          .json({ status: 'error', message: "token doesn't exist" })
      }
      req.user = user
      return next()
    })(req, res, next)
  },
  authenticatedUser: (req, res, next) => {
    if (helper.getUser(req)) {
      if (helper.getUser(req).role !== 'admin') {
        return next()
      }
      return res.json({ status: 'error', message: 'permission denied' })
    } else {
      return res.json({ status: 'error', message: 'permission denied' })
    }
  },
  authenticatedAdmin: (req, res, next) => {
    if (helper.getUser(req)) {
      if (helper.getUser(req).role === 'admin') {
        return next()
      }
      return res.json({ status: 'error', message: 'permission denied' })
    } else {
      return res.json({ status: 'error', message: 'permission denied' })
    }
  },
  socketAuthenticated: (socket, next) => {
    const token = socket.handshake.auth.token //從handshake資料取得token
    const SECRET = process.env.JWT_SECRET

    // verify a token
    jwt.verify(token, SECRET, async (err, decoded) => {
      try {
        const user = (await User.findByPk(decoded.id)).toJSON()
        socket.user = user
        return next()
      } catch(err) {
        return console.log(err)
      }
    })
  }
}
