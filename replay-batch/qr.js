const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();
const sqs = new AWS.SQS();

const queueUrl = process.env.queue;


let main = async() => {


    let done = false;
    let lastEvaluated = undefined;

    while(!done) {
        var params = {
            TableName: 'cloudevents-to-ddb-dev', //TODO - remove hardcodes
            IndexName: 'timestampIdx',
            ExpressionAttributeValues: {
                ":et": {
                    S: process.env.type
                },
                ":start" : {
                    S: process.env.startDate
                },
                ":end" : {
                    S: process.env.endDate
                }
            },
            ExpressionAttributeNames: {
                "#ts":"timestamp"
            },
            KeyConditionExpression: "eventType=:et and #ts between :start and :end",
            Limit: 5
        };

        if(lastEvaluated != undefined) {
            params.ExclusiveStartKey = lastEvaluated;
        }

        console.log(params);

        let response = await ddb.query(params).promise();

        //console.log(AWS.DynamoDB.Converter.unmarshall(response.Item.eventData.M));
        //console.log(response);
        let items = response.Items;
        let entries = [];

        items.forEach((item, idx)=> {
            let unmarshalled = AWS.DynamoDB.Converter.unmarshall(item.eventData.M);
            console.log(unmarshalled)
            entries.push({
                Id: `${idx}`,
                MessageBody: JSON.stringify(unmarshalled)
            })
        });

        let sqsParams = {
            Entries: entries,
            QueueUrl: queueUrl
        };

        let queueResponse = await sqs.sendMessageBatch(sqsParams).promise();
        console.log(queueResponse);

        lastEvaluated = response.LastEvaluatedKey;
        if(lastEvaluated == undefined) {
            console.log('all done yo');
            done = true;
        }
    }
};

let doMain = async () => {
    try {
        await main();
    } catch(err) {
        console.log(err);
        console.log('exit with error status');
        process.exit(1);
    }
}

console.log(process.env);
 doMain();

