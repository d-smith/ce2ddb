const program = require('commander');
const AWS = require('aws-sdk');
const { DynamoDB } = require('aws-sdk');
const ddb = new AWS.DynamoDB();

let main = async() => {
    program
        .version('0.0.1')
        .requiredOption('-i, --id <event id>', 'Event Id')
        .requiredOption('-t, --table-name <tableName>','Table name')
        .parse(process.argv);

    let options = program.opts();
    console.log(options);

    console.log(`look for event id ${options.id}`);

    var params = {
        Key: {
            "id": {
                "S": options.id
            }
        },
        TableName: options.tableName
    };

    let response = await ddb.getItem(params).promise();

    console.log(AWS.DynamoDB.Converter.unmarshall(response.Item.eventData.M));
};

let doMain = async () => {
    await main();
}

doMain();

