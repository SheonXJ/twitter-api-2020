const { Message, User } = require('../../models')

const chatroomController = {
  getMessageHistory: async (req, res) => {
    try {
      const allMessage = await Message.findAll({
        raw: true,
        nest: true,
        where: { roomName: req.params.roomName },
          include: { model: User, attributes: ["name", "avatar"] },
          order: [["createdAt", "DESC"]],
          limit: 50,
        })
      return res.status(200).json(allMessage.reverse())
    } catch (err) {
      console.log(err)
      return res.status(400).json({ message: err })
    }
  },
}

module.exports = chatroomController