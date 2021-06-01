
const readline = require('readline');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB();

const table_name = process.env.DYNAMODB_TABLE;
const ttl_seconds = parseInt(process.env.TTL_SECONDS);

let writeLine2DDB = async (line) => {
    let parsed = JSON.parse(line);
    console.log(`write record of type ${parsed.type} at timestamp ${parsed.time}`);

    console.log(`write to table ${table_name} with TTL of ${ttl_seconds}`);
    let params = {
        Item: {
            "id": {
                "S":parsed.id
            },
            "timestamp" : {
                "S":parsed.time
            },
            "ttl_deadline" : {
                "N": (Math.round(new Date().getTime()/1000) + ttl_seconds).toString()
            },
            "eventType": {
                "S":parsed.type
            },
            "eventData": {
                "M":AWS.DynamoDB.Converter.marshall(parsed)
            }
        },
        TableName: table_name
    }

    console.log(params);

    let result = await ddb.putItem(params).promise();
    console.log(result);
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