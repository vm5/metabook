const SMTPServer = require('smtp-server').SMTPServer;

const server = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    let mail = '';
    stream.on('data', (chunk) => {
      mail += chunk;
    });
    stream.on('end', () => {
      console.log('Received email:');
      console.log(mail);
      callback();
    });
  }
});

server.listen(587, () => {
  console.log('Local SMTP server running on port 587');
}); 