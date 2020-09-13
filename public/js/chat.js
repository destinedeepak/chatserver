const socket = io()

const autoscroll =()=>{
    //new message element

    const $newMessage = $messages.lastElementChild
    
    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    newMessageMargin =  parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

const $messageForm = document.querySelector('#message-form')
const $messageFormButton = $messageForm.querySelector('button')
const $messageFormInput = $messageForm.querySelector('input')

const $messages = document.querySelector('#messages')
 
//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix:true })


 
socket.on('printMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username:message.username,
       message: message.text,
       createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage',(url)=>{
    console.log(url)
    const html = Mustache.render(locationTemplate,{
        username:url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sideBarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault() 

    $messageFormButton.setAttribute('disabled', 'disabled')//disable

    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')//enable
        $messageFormInput.value=''//to clear message
        $messageFormInput.focus() // to move cursor inside

        
    })

})

const $sendlocation = document.querySelector('#send-location')

$sendlocation.addEventListener('click',(e)=>{
    e.preventDefault()

   if(!navigator.geolocation){
        return alert('geolocation is not working here')
    }

    $sendlocation.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{

        socket.emit('send-location', {
            latitude:position.coords.latitude, 
            longitude:position.coords.longitude
        },(data)=>{

            $sendlocation.removeAttribute('disabled')
            console.log(data,'location shared')
        }) 
    })

})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

