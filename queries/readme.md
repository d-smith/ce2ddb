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

For a type by date range:

```
node bytype.js  -t cloudevents-to-ddb-dev -i timestampIdx -e com.example.someevent -s "2021-05-30-08:43" -z "2021-05-30-08:44"
```