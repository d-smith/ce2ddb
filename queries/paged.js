const program = require('commander');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();


let main = async() => {
    program
        .version('0.0.1')
        .requiredOption('-i, --idx <indexName>', 'Index Name')
        .requiredOption('-t, --table-name <tableName>','Table name')
        .requiredOption('-e, --event-type <eventType>', 'Event type')
        .parse(process.argv);

    let options = program.opts();
    console.log(options);

    console.log(`look for event type ${options.eventType}`);

    let done = false;
    let lastEvaluated = undefined;

    while(!done) {
        var params = {
            TableName: options.tableName,
            IndexName: options.idx,
            ExpressionAttributeValues: {
                ":et": {
                    S: options.eventType
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
    await main();
}

doMain();

