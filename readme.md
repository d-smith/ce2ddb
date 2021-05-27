# ce to ddb

Write the cloudevents contained in s3 objects to a ddb table

## deploy

sls deploy
sls s3deploy


## test event

```
{
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "2021-05-27T21:11:10.607Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AWS:AROAWHHOD6OIJEA7ALDQ6:AWSFirehoseToS3"
            },
            "requestParameters": {
                "sourceIPAddress": "100.26.246.217"
            },
            "responseElements": {
                "x-amz-request-id": "T89JYAFYYFFWP8Y8",
                "x-amz-id-2": "BtNq1UWcE2OAxTAhdCoYbFjApKrBve3108OBJ77WvD1kq+9D/Mt1etZB/m71hWqVYyoF/WKIDmNWH5PD05W+wqpOXmTpoZZJ"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "exS3-v2--f962ad7d93b352a0aeac438af0a921ee",
                "bucket": {
                    "name": "97068-firehose-sink",
                    "ownerIdentity": {
                        "principalId": "AN7JEPYCEBG67"
                    },
                    "arn": "arn:aws:s3:::97068-firehose-sink"
                },
                "object": {
                    "key": "2021/05/27/21/s1FH-2-2021-05-27-21-09-56-c0def0d7-886b-4e82-a945-a057bbd894ce",
                    "size": 5786,
                    "eTag": "a8f9c421ee497dbf1e8e1deb9536a60d",
                    "sequencer": "0060B00AF2615F0D16"
                }
            }
        }
    ]
}
```