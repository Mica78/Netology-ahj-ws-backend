class Message {
  constructor(user, messageText) {
    this.user = user;
    this.messageText = messageText;
    this.date = new Date();
  }

  get messageData() {
    return {
      user: this.user.userData(),
      messageText: this.messageText,
      date: this.date,
    }
  }
}

module.exports = Message;
