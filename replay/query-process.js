let step1 = async (event) => {
    console.log(event);

    if(event.type == undefined || event.startDate == undefined || event.endDate == undefined) {
        throw new Error("Input must include type, startDate, endDate");
    }
    event['queryState'] = 'running';
    return event;
}

let step2 = async (event) => {
    console.log(event)
    if(Math.random() < 0.5) {
        console.log('query done');
        event['queryState'] = 'done';
    } else {
        console.log('query still running...')
    }
    return event;
}

module.exports = {
    step1,
    step2
};