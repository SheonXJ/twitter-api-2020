const { Message, User } = require('../../models')
const { Op } = require("sequelize");
const { Sequelize } = require("../../models");
const helpers = require('../../_helpers')

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
      });
      return res.status(200).json(allMessage.reverse());
    } catch (err) {
      console.log(err);
      return res.status(400).json({ message: err });
    }
  },
  getMessageLatest: async (req, res) => {
    try {
      const currentUserId = String(helpers.getUser(req).id);
      const latestMessage = await Message.findAll({
        raw: true,
        nest: true,
        where: {
          roomName: {
            [Op.or]: [
              { [Op.like]: `%R${currentUserId}` },
              { [Op.like]: `${currentUserId}R%` },
            ],
          },
        },
        // attributes: [  
        //   "roomName",
        //   [Sequelize.fn("max",Sequelize.col("createdAt")), "createdAt"]
        // ],
        group: ["Message.roomName"],
        order: [["createdAt", "DESC"]],
      });
      //找出聊天對象的User資料
      //async/await 不適用於forEach loop
      for (let message of latestMessage) {
        const chatUserList = message.roomName.split('R')
        const chatUserId = chatUserList.filter(id => id !== currentUserId)
        const chatUser = (await User.findByPk(chatUserId[0], {
          raw: true,
          nest: true,
          attributes: ["id", "name", "avatar", "account"],
        }));
        message.chatUser = chatUser
      }
      return res.status(200).json(latestMessage)
    } catch (err) {
      return res.status(400).json({ message: err})
    }
  }
};

module.exports = chatroomController