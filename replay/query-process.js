const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

let startJob = async (event) => {
    console.log(event);

    if(event.type == undefined || event.startDate == undefined || event.endDate == undefined) {
        throw new Error("Input must include type, startDate, endDate");
    }
    event['queryState'] = 'running';
    return event;
}

let executeQuery = async (event) => {
    console.log(event)

    var params = {
        TableName: process.env.DYNAMODB_TABLE,
        IndexName: process.env.DYNAMODB_IDX,
        ExpressionAttributeValues: {
            ":et": {
                S: event.type
            },
            ":start" : {
                S: event.startDate
            },
            ":end" : {
                S: event.endDate
            },
        },
        ExpressionAttributeNames: {
            "#ts":"timestamp"
        },
        KeyConditionExpression: "eventType=:et and #ts between :start and :end",
        Limit: process.env.MAX_ITEMS
    };

    let lastEvaluated = event.lastEvaluated;
    if(lastEvaluated != undefined) {
        params.ExclusiveStartKey = lastEvaluated;
    }

    console.log(params);

    let response = await ddb.query(params).promise();

    console.log(response);
    lastEvaluated = response.LastEvaluatedKey;
    if(lastEvaluated == undefined) {
        console.log('query finished');
        event['queryState'] = 'done';
    } else {
        event.lastEvaluated = lastEvaluated;
    }

    
    
    return event;
}

module.exports = {
    startJob,
    executeQuery
};