const udp = require('dgram');

// Create udp socket
const client = udp.createSocket('udp4');

const ip = '142.4.210.168';
const port = 27015;

// TSource Engine Query - normal query 
const hex = Buffer.from('ffffffff54536f7572636520456e67696e6520517565727900', 'hex')


// Socket send
client.send(hex, port, ip, (error) =>{

    // Check if packet is sent?
    if(!error){
        console.log('Normal TSource Engine Query packet have been sended.'); 
    }      
});

// emits on new datagram msg
client.on('message', (msg) => {
    
    // Get buffer value at position 4 in buffer object and check if its equal to challenge response (0x41 === 65)
    if(msg[4] === 65){

        // If yes craft new A2S_INFO packet with challenge response
        const A2S_INFO_REQUEST = Buffer.concat([Buffer.from('ffffffff', 'hex'), Buffer.from('54536f7572636520456e67696e6520517565727900', 'hex'), Buffer.from(msg.toString('hex', 5), 'hex')]);

        // Send new packet with challenge response
        client.send(A2S_INFO_REQUEST, port, ip, (error) =>{
            // Check if packet is sent?
            if(!error){
                console.log('Modified TSource Engine Query packet have been sended. Packet (hex): %s', A2S_INFO_REQUEST); 
            }      
        });
    }

    // Check if response is actually A2S_INFO response 0X49 === 73 int
    if(msg[4] === 73){
        console.log('Received A2S_INFO from gameserver.')
        console.log(msg.toString('ascii'));
    }

});

