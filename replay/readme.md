

To invoke, POST to the endpoint using the given API Key, e.g.

curl -X POST -d '{"type":"com.example.someevent","startDate":"2021-06-02-06:15", "endDate":"2021-06-02-10:44"}' -k https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/create -H 'X-Api-Key:xxxxxx'