const users = require('../../../database/Users');
const leaveAllRoom = require('../../modules/leaveAllRoom');
const getSelectedRoom = require('../../modules/getSelectedRoom');

const rooms = require('../../rooms');
module.exports = function disconnect() {
  const { socket } = this;
  const userSession = socket.handshake.session;
  try {
    const userInfo = userSession.userinfo;
    const roomId = userInfo.room;
    const userNickname = userInfo.nickname;

    socket.emit('user:exit', userNickname);
    socket.broadcast.to(roomId).emit('user:exit', userNickname);

    let selectedRoom = getSelectedRoom(rooms, roomId);
    selectedRoom.members.splice(selectedRoom.members.indexOf(userNickname), 1, null);
    leaveAllRoom(socket);

    if (selectedRoom.readiedPlayer.indexOf(userNickname) > -1) {
      selectedRoom.readiedPlayer.splice(selectedRoom.readiedPlayer.indexOf(userNickname), 1);
      selectedRoom.ready--;
    }

    selectedRoom.currentUsers.forEach((memberData, index) => {
      memberData.nickname === userNickname && selectedRoom.currentUsers.splice(index, 1);
    });

    const checkRoomPeople = selectedRoom.members.filter(elem => elem).length;
    if (checkRoomPeople === 0) {
      rooms.splice(rooms.indexOf(selectedRoom), 1);
    } else if (selectedRoom.host === userNickname) {
      selectedRoom.host = selectedRoom.members.findNextHost();
      socket.broadcast.to(roomId).emit('host:change', selectedRoom.host);
    }

  } catch (error) {

  } finally {
    users.disconnected();
  }
};
