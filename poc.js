const udp = require('dgram');

// Create udp socket
const client = udp.createSocket('udp4');

const ip = '';
const port = 0;

let sent = 0;
let received = 0;
let bytes = 0;


// TSource Engine Query
const hex = Buffer.from('ffffffff54536f7572636520456e67696e6520517565727900', 'hex')

// emits on new datagram msg
client.on('message', (msg) => {
  bytes = bytes + parseInt(msg.length);
  received++;
});


const statusPrint = () =>{
    console.log('%s requests to gameserver. ', sent);
    console.log('%s responses from gameserver with %s bytes. ', received, bytes);
}

// Run test for 1 minute
const runFor1muinuteInterval = setInterval(() =>{

    // Socket function to send Buffer object
    client.send(hex, port, ip, (error) =>{

        // Check if packet is sent?
        if(!error){

            // Increment sent status
            sent++;
        }      
    });
    
})

// Clear interval after 1 minute
setTimeout(()=>{clearInterval(runFor1muinuteInterval); statusPrint(); }, 60000);