const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();


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
                }
            },
            KeyConditionExpression: "eventType=:et",
            Limit: 5
        };

        if(lastEvaluated != undefined) {
            params.ExclusiveStartKey = lastEvaluated;
        }

        console.log(params);

        let response = await ddb.query(params).promise();

        //console.log(AWS.DynamoDB.Converter.unmarshall(response.Item.eventData.M));
        console.log(response);

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

