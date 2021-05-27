
const readline = require('readline');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

let writeLine2DDB = async (line) => {
    let parsed = JSON.parse(line);
    console.log(`write record of type ${parsed.type} at timestamp ${parsed.time}`);
}

module.exports.handleS3Event = async (event, context) => {
    console.log(`Event: ${JSON.stringify(event)}`);

    let records = event.Records;
    for(rec of records) {
        console.log(rec);

        let bucket = rec.s3.bucket.name;
        let key = rec.s3.object.key;

        console.log(`read object with key ${key} from bucket ${bucket}`);

        const s3ReadStream = s3.getObject({
            Bucket: bucket,
            Key: key
        }).createReadStream();

        const rl = readline.createInterface({
            input: s3ReadStream,
            terminal: false
          });
      
          let myReadPromise = new Promise((resolve, reject) => {
      
              rl.on('line', async (line) => {
                console.log(`Line from file: ${line}`);
                await writeLine2DDB(line);
              });
              rl.on('error', () => {
                  console.log('error');
              });
              rl.on('close', function () {
                  console.log('closed');
                  resolve();
              });
          });
      
          try { await myReadPromise; }
          catch(err) {
              console.log('an error has occurred');
          }
      
          console.log('done reading!');


    }

    return 'ok';
} 