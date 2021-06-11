# query examples

## By id


Via CLI:

```
aws dynamodb get-item --table-name cloudevents-to-ddb-dev \
--key '{"id":{"S":"2e825bf2-9d45-481d-84b3-e12dc965bf4c"}}'
```

Via byid.js:

```
node byid.js -i 2e825bf2-9d45-481d-84b3-e12dc965bf4c -t cloudevents-to-ddb-dev
```

## By type

For a type by date range:

Via CLI:

```
aws dynamodb query --table-name cloudevents-to-ddb-dev \
--index-name timestampIdx \
--key-condition-expression "eventType=:et and #ts between :start and :end" \
--expression-attribute-names '{"#ts":"timestamp"}' \
--expression-attribute-values '{":et":{"S":"com.example.someevent"},":start":{"S":"2021-06-01-06:43"},":end":{"S":"2021-06-01-10:44"}}'

```

```
node bytype.js  -t cloudevents-to-ddb-dev -i timestampIdx -e com.example.someevent -s "2021-05-30-08:43" -z "2021-05-30-08:44"
```


Everything for a given type

```
aws dynamodb query --table-name cloudevents-to-ddb-dev --index-name timestampIdx --key-condition-expression "eventType=:et" --expression-attribute-values '{":et":{"S":"com.example.someevent"}}'
```

## By range in small chunks

First query, here assume we want to get chunks of 5 items.

```
aws dynamodb query --table-name cloudevents-to-ddb-dev \
--max-items 5 \
--index-name timestampIdx \
--key-condition-expression "eventType=:et and #ts between :start and :end" \
--expression-attribute-names '{"#ts":"timestamp"}' \
--expression-attribute-values '{":et":{"S":"com.example.someevent"},":start":{"S":"2021-06-02-06:15"},":end":{"S":"2021-06-02-10:44"}}'
```

For subsequent queries extract the next token from the reults and use it as the value of --starting-token

```
aws dynamodb query --table-name cloudevents-to-ddb-dev \
--max-items 5 \
--starting-token eyJFeGNsdXNpdmVTdGFydEtleSI6IG51bGwsICJib3RvX3RydW5jYXRlX2Ftb3VudCI6IDV9 \
--index-name timestampIdx \
--key-condition-expression "eventType=:et and #ts between :start and :end" \
--expression-attribute-names '{"#ts":"timestamp"}' \
--expression-attribute-values '{":et":{"S":"com.example.someevent"},":start":{"S":"2021-06-02-06:15"},":end":{"S":"2021-06-02-10:44"}}'
```

## S3 select

Can we query this data directly from S3 using S3 select?

First, S3 select is for a single S3 object, so you would have to build something around the different objects, bucket structure, etc. to look through all the objects, apply date ranges in efficient ways, combine results... in other words build Athena.

Setting that aside, can we query inside a single object?

Finding an object to query...

```
aws s3 ls s3://97068-firehose-sink/2021/06/02/13/
2021-06-06 08:39:55      18042 s1FH-2-2021-06-02-13-18-35-eacfa325-9a30-4c69-a1a5-a3068258d602
2021-06-06 08:39:55      17460 s1FH-2-2021-06-02-13-19-37-95aa0c2d-4596-4076-a522-574d3d417d58
etc.
```

Looking at the content of an object, we see it is in JSON lines format, e.g. one JSON document per line:

```
(base) lappy:ce2ddb ds$ aws s3 cp s3://97068-firehose-sink/2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af ./sample-s3-object
download: s3://97068-firehose-sink/2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af to ./sample-s3-object

(base) lappy:ce2ddb ds$ tail ./sample-s3-object {"specversion":"1.0","type":"com.example.someevent","source":"/mycontext","id":"877718f1-03bb-417b-ae60-cb1706ab0a57","time":"2021-06-02-06:35:14:100PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"text/xml","data":"<much wow=\"xml\"/>"}
{"specversion":"1.0","type":"com.example.someevent","source":"/mycontext","id":"4d09a840-d605-4e74-803c-22415251e9aa","time":"2021-06-02-06:35:15:106PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"text/xml","data":"<much wow=\"xml\"/>"}
etc...

etc...
```

According to S3 select documentation, s3 select works on s3 objects stored in JSON format. But... does it expect a single JSON object or is a JSON lines object with a JSON object per line queryable?

Yes, you can query this way - just specify a value of Lines for the JSON Type attribute on the input serialization spec.

Try these queries:

```
aws s3api select-object-content \
--bucket 97068-firehose-sink \
--key 2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af \
--expression "SELECT COUNT(*) FROM S3OBJECT s AS count" \
--expression-type 'SQL' \
--input-serialization '{"JSON":{"Type":"Lines"}}' \
--output-serialization '{"JSON":{"RecordDelimiter":"\n"}}' /dev/stdout


aws s3api select-object-content \
--bucket 97068-firehose-sink \
--key 2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af \
--expression "SELECT * FROM S3OBJECT s where s.id = '877718f1-03bb-417b-ae60-cb1706ab0a57'" \
--expression-type 'SQL' \
--input-serialization '{"JSON":{"Type":"Lines"}}' \
--output-serialization '{"JSON":{"RecordDelimiter":"\n"}}' /dev/stdout
```

With output...

```
$ aws s3api select-object-content \
> --bucket 97068-firehose-sink \
> --key 2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af \
> --expression "SELECT COUNT(*) FROM S3OBJECT s" \
> --expression-type 'SQL' \
> --input-serialization '{"JSON":{"Type":"Lines"}}' \
> --output-serialization '{"JSON":{"RecordDelimiter":"\n"}}' /dev/stdout
{"_1":33}

$ aws s3api select-object-content \
> --bucket 97068-firehose-sink \
> --key 2021/06/02/13/s1FH-2-2021-06-02-13-34-51-f3c10df8-2e6a-4fea-a0aa-39b4205929af \
> --expression "SELECT * FROM S3OBJECT s where s.id = '877718f1-03bb-417b-ae60-cb1706ab0a57'" \
> --expression-type 'SQL' \
> --input-serialization '{"JSON":{"Type":"Lines"}}' \
> --output-serialization '{"JSON":{"RecordDelimiter":"\n"}}' /dev/stdout
{"specversion":"1.0","type":"com.example.someevent","source":"/mycontext","id":"877718f1-03bb-417b-ae60-cb1706ab0a57","time":"2021-06-02-06:35:14:100PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"text/xml","data":"<much wow=\"xml\"/>"}
```