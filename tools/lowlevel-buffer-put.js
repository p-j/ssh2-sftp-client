'use strict';

const path = require('path');

const dotenvPath = path.join(__dirname, '..', '.env');

require('dotenv').config({path: dotenvPath});

const Client = require('ssh2');
const { Readable } = require('stream');

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.on('close', () => console.log('read stream close'));
  stream.on('data', () => console.log('read stream data'));
  stream.on('end', () => console.log('read stream end'));
  stream.on('error', () => console.log('read stream error'));
  stream.on('pause', () => console.log('read stream pause'));
  stream.on('resume', () => console.log('read stream resume'));
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const config = {
  host: process.env.SFTP_SERVER,
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASSWORD,
  port: process.env.SFTP_PORT || 22
};

const client = new Client();

const size = parseInt(process.argv[2]);
const remotePath = process.argv[3];

client
  .on('ready', function () {
    client.sftp(function (err, sftp) {
      if (err) {
        console.log(`Error: ${err.message}`);
      } else {
        let stream = sftp.createWriteStream(remotePath, {encoding: null});
        stream.on('error', (err) => {
          console.log(`Stream Error: ${err.message}`);
          client.end();
        });
        stream.on('finish', () => {
          console.log(`File successfully uploaded to ${remotePath}`);
          client.end();
        });
        stream.on('drain', () => console.log('write stream drain'));
        stream.on('pipe', () => console.log('write stream pipe'));
        stream.on('unpipe', () => console.log('write stream unpipe'));
        let bufSize = 1024 * size;
        let buf = Buffer.alloc(bufSize);
        console.log(`Uploading buffer of ${bufSize} bytes to ${remotePath}`);
        bufferToStream(buf).pipe(stream);
        // stream.end();
      }
    });
  })
  .on('error', function (err) {
    console.error(err.message);
  })
  .connect(config);
