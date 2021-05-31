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
--expression-attribute-values '{":et":{"S":"com.example.someevent"},":start":{"S":"2021-05-30-08:43"},":end":{"S":"2021-05-30-08:44"}}'

```

```
node bytype.js  -t cloudevents-to-ddb-dev -i timestampIdx -e com.example.someevent -s "2021-05-30-08:43" -z "2021-05-30-08:44"
```


Everything for a given type

```
aws dynamodb query --table-name cloudevents-to-ddb-dev --index-name timestampIdx --key-condition-expression "eventType=:et" --expression-attribute-values '{":et":{"S":"com.example.someevent"}}'
```