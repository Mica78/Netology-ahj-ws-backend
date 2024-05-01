const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const cors = require("@koa/cors");
const WS = require('ws');
const User = require('./user');
const Message = require("./messages")

const app = new Koa();

app.use(cors());

app.use(
  koaBody({
    urlencoded:true,
  })
);

const port = process.env.PORT || 7000;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({
  server
});

const users = [];

const usersJsonData = () => {
  const usersArray = [];
  for (const user of users) {
    usersArray.push (user.userData);
  }
  return usersArray;
};

const serverUser = new User(0, "server")

const chat = [new Message(serverUser, 'welcome to our chat')];

wsServer.on('connection', (ws) => {
  //* в этом блоке хочу реализовать восстановление подключения, но пока не знаю как связать с удалением
  const userInBaseById = users.find(user => user.id === ws._socket._handle.fd);

  if (userInBaseById) {
    console.log(users)
    ws.id = userInBaseById.id;
    console.log(ws.id);
    ws.send(JSON.stringify({ Autorization: userInBaseById.userData }))
    console.log(users)
    ws.send(JSON.stringify({ users: usersJsonData()}))
    ws.send(JSON.stringify({ chat }))
  }

  ws.on('message', (message) => {
    let parsedMessage = JSON.parse(message);

    if (Object.keys(parsedMessage).includes("login")) {
      const userInBaseByName = users.find(user => user.name === parsedMessage.login);

      if(userInBaseByName) {

        ws.send(JSON.stringify({ Autorization: false }));
      } else {
        const user = new User(ws._socket._handle.fd, parsedMessage.login);
        users.push(user);
        ws.id = user.id;
        ws.send(JSON.stringify({ Autorization: user.userData }))
        sendMessageToAllUsers({ users: usersJsonData()})
        ws.send(JSON.stringify({ chat }))
      }
    } else if (Object.keys(parsedMessage).includes("message")) {

      const user = parsedMessage.message.user;
      const messageTextData = parsedMessage.message.messageData;

      const message = new Message(user, messageTextData)

      chat.push(message);

      const eventData = JSON.stringify({ chat: [message] });
      const clientsArray = Array.from(wsServer.clients);
      const readyStateClients = clientsArray.filter(client => client.readyState === WS.OPEN)
      readyStateClients.forEach(client => client.send(eventData));
    }

  });

  ws.on("close", (code) => {
    // setTimeout(() => {
      const idx = users.findIndex(user => user.id === ws.id);
      users.splice(idx, 1);
      const message = { users: usersJsonData() }
      sendMessageToAllUsers(message);
    // }, 60000)

  })

});

const sendMessageToAllUsers = function(message) {
  const eventData = JSON.stringify(message);
  const clientsArray = Array.from(wsServer.clients);
  const readyStateClients = clientsArray.filter(client => client.readyState === WS.OPEN)
  readyStateClients.forEach(client => client.send(eventData));
}

// console.log("Server start on port" + port)
server.listen(port);
