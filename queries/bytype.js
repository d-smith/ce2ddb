const program = require('commander');
const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');
const { option } = require('commander');
const ddb = new AWS.DynamoDB();

/*
command line:

aws dynamodb query --table-name cloudevents-to-ddb-dev --index-name timestampIdx --key-condition-expression "eventType=:et" --expression-attribute-values '{":et":{"S":"com.example.someevent"}}'

*/

let main = async() => {
    program
        .version('0.0.1')
        .requiredOption('-i, --idx <indexName>', 'Index Name')
        .requiredOption('-t, --table-name <tableName>','Table name')
        .requiredOption('-e, --event-type <eventType>', 'Event type')
        .requiredOption('-s, --start <start>', 'Start date')
        .requiredOption('-z, --end <end>', 'End date')
        .parse(process.argv);

    let options = program.opts();
    console.log(options);

    console.log(`look for event type ${options.eventType}`);

    var params = {
        TableName: options.tableName,
        IndexName: options.idx,
        ExpressionAttributeValues: {
            ":et": {
                S: options.eventType
            },
            ":start" : {
                S: options.start
            },
            ":end" : {
                S: options.end
            }
        },
        ExpressionAttributeNames: {
            "#ts":"timestamp"
        },
        KeyConditionExpression: "eventType=:et and #ts between :start and :end"
    };

    console.log(params);

    let response = await ddb.query(params).promise();

    //console.log(AWS.DynamoDB.Converter.unmarshall(response.Item.eventData.M));
    console.log(response);
};

let doMain = async () => {
    await main();
}

doMain();

