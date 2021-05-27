
module.exports.handleS3Event = async (event, context) => {
    console.log(`Event: ${JSON.stringify(event)}`);
    return 'ok';
} 