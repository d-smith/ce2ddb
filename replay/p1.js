module.exports.step1 = async (event, context) => {
    console.log(event);
    event['step1Greeting'] = 'step 1 says hello';
    return event;
}

module.exports.step2 = async (event, context) => {
    console.log(event)
    event['step2Greeting'] = 'step 2 says yo';
    return event;
}