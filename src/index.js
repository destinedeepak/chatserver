const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000 
const publicDirectortPath = (path.join(__dirname,'../public'))



app.use(express.static(publicDirectortPath))

let count=0

io.on('connection',(socket)=>{
    console.log('server established')

    socket.on('join', ({username, room}, callback)=>{
      const {error, user} = addUser({id: socket.id, username, room })//you can also use spread operator

      if(error){
          return callback(error)
      }

      socket.join(user.room)

      socket.emit('printMessage',generateMessage('Admin','Welcome!'))
      socket.broadcast.to(user.room).emit('printMessage',generateMessage('Admin',`${user.username} has joined`))
      
      io.to(user.room).emit('roomData', {
        room:user.room,
        users: getUsersInRoom(user.room)
      })
      callback()//to tell client everthing went well
    })

    socket.on('sendMessage',(message, callback)=>{
        const user = getUser(socket.id)
      // const filter = new Filter()

      // if(filter.isProfane(message)){
      //     return callback('Profanity is not allowed!')
      // }

        io.to(user.room).emit('printMessage',generateMessage(user.username,message))
        callback()
    })

    socket.on('send-location',(data, callback)=>{

      const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `http://google.com/maps?q=${data.latitude},${data.longitude}`))
        callback('location is sharing')
    })
    
    socket.on('disconnect', ()=>{
      const user =  removeUser(socket.id)

      if(user){
        io.to(user.room).emit('printMessage', generateMessage('Admin',`${user.username} has left!`)) 
        
        io.to(user.room).emit('roomData', {
          room:user.room,
          users: getUsersInRoom(user.room)
        })
      }
      
    })
})


server.listen(port, ()=>{
 console.log('server is upto', port)
})

