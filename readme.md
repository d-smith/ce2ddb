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
            "eventTime": "2021-06-06T15:55:15.085Z",
            "eventName": "ObjectCreated:Copy",
            "userIdentity": {
                "principalId": "AWS:AIDAINNFPARQBFDTW2UOO"
            },
            "requestParameters": {
                "sourceIPAddress": "71.236.185.79"
            },
            "responseElements": {
                "x-amz-request-id": "ZR7PW1QTYWTEB365",
                "x-amz-id-2": "38or64Gnb6znK2EnlPWBcd4Q+zIKKWsPAc/NZc5qKJ+byKeCbU+hLHxDKBhA2CvpRQl+34NdNwPDbdVMrTHPmoclobCxebI0"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "5b21bad6-fe2b-4b85-b26f-ca0d22020313",
                "bucket": {
                    "name": "97068-tmp",
                    "ownerIdentity": {
                        "principalId": "AN7JEPYCEBG67"
                    },
                    "arn": "arn:aws:s3:::97068-tmp"
                },
                "object": {
                    "key": "s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af",
                    "size": 9603,
                    "eTag": "030d6881ec7b8cb9c99f316ad577c19f",
                    "sequencer": "0060BCEFE9542F9CC8"
                }
            }
        }
    ]
}

```