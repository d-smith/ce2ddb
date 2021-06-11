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


## With Athena

First we need to define a table...

CREATE DATABASE CEDB

Create table via crawling...

SHOW TABLES

g05
g06
g16
g2020
gs1fh_1_2021_04_07_15_45_52_72fbc5a8_9221_4c46_925b_0aed10815fea
gs1fh_1_2021_04_07_15_46_55_8bdb5091_f7ba_483c_a8c0_59dd39079d50
gs1fh_1_2021_04_07_15_47_58_bb7d9a75_cc2a_4b9e_b692_eda7e9cf83e5
gs1fh_1_2021_04_07_15_49_00_6761f0ab_ec29_4237_9e8d_844e8a9e6fe8
gs1fh_1_2021_04_07_15_50_51_bc75c01b_dd6d_4831_8a9d_2acfc3baea1a
gs1fh_1_2021_04_07_15_51_53_6add69e4_6bd6_4ca7_9410_c736f403a482
gs1fh_1_2021_04_07_15_52_55_97a268cf_6b2c_489f_8a31_e63de786439e
gs1fh_1_2021_04_07_15_53_57_364bc6c0_98b9_4de4_97ff_f04ed5fbd3c5
gs1fh_1_2021_04_07_15_55_00_c0d9156c_c6ed_4586_bada_c7a220741250
gs1fh_1_2021_04_07_15_56_02_ba851e69_ef78_41e4_8786_017e30e826e7
gs1fh_1_2021_04_07_15_57_03_5a4a9047_a757_4cb1_b6d2_36d70e6b4885
gs1fh_1_2021_04_07_15_58_03_da9a5680_a159_4177_9557_0222a9e47e23
gs1fh_1_2021_04_07_15_59_07_0ea20da2_83e1_42de_9a14_62b74ba52818

Lots of tables based on the hetero-genous content of the bucket...

From Homegeneous data with the examples from the object above...

DESCRIBE g2020

specversion         	string              	from deserializer   
x-ues-specversion   	string              	from deserializer   
source              	string              	from deserializer   
type                	string              	from deserializer   
time                	string              	from deserializer   
id                  	string              	from deserializer   
x-meta              	struct<contentversion:string>	from deserializer   
data                	struct<test:boolean>	from deserializer   
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string              	                    
	 	 
# Partition Information	 	 
# col_name            	data_type           	comment             
	 	 
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string      

select id, data from g2020 limit 2

1	fcc50e46-4d84-4048-9ca5-6697cfef397c	{test=true}

DESCRIBE gs1fh_1_2021_04_07_15_51_53_6add69e4_6bd6_4ca7_9410_c736f403a482

k1                  	struct<o1:string>   	from deserializer   
k2                  	string              	from deserializer   

select * from gs1fh_1_2021_04_07_15_51_53_6add69e4_6bd6_4ca7_9410_c736f403a482 limit 2

Zero records returned.

DESCRIBE g06

specversion         	string              	from deserializer   
type                	string              	from deserializer   
source              	string              	from deserializer   
id                  	string              	from deserializer   
time                	string              	from deserializer   
comexampleextension1	string              	from deserializer   
comexampleothervalue	int                 	from deserializer   
unsetextension      	string              	from deserializer   
datacontenttype     	string              	from deserializer   
data                	string              	from deserializer   
partition_0         	string              	                    
partition_1         	string

select id, data from g06 limit 2

id	data
1	6f66f457-110b-4ce7-ac80-4f2c53b034c5	<much wow="xml"/>
2	fb9d6257-786b-4386-8bce-5520dcc27c3a	<much wow="xml"/>

select count(*) from gs1fh_1_2021_04_07_15_45_52_72fbc5a8_9221_4c46_925b_0aed10815fea

HIVE_UNSUPPORTED_FORMAT: Unable to create input format

This query ran against the "cedb" database, unless qualified by the query. Please post the error message on our forum or contact customer support with Query Id: 90d05d78-c90d-44fb-94a6-fe7044b888c7.

So... heterogenous data in the bucket leads to some level of chaos 

Next: single type with some variable structure?


```
{"specversion":"1.0","type":"vehicle.registered","source":"/mycontext","id":"03344ce3-9fad-43cc-8889-65be8c0f84ef","time":"2021-06-11-10:11:43:288PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"application/json","data":{"vtype":"car","details":{"doors":4,"engine":"gas","engineType":"v8"}}}
{"specversion":"1.0","type":"vehicle.registered","source":"/mycontext","id":"f5ac612c-35b9-4d6f-b256-2b1565f9f71e","time":"2021-06-11-10:11:43:395PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"application/json","data":{"vtype":"boat","details":{"length":40,"type":"sail"}}}
{"specversion":"1.0","type":"vehicle.registered","source":"/mycontext","id":"e9cd2b95-3621-4cc9-aba2-a944c9ddf590","time":"2021-06-11-10:11:43:498PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"application/json","data":{"vtype":"plane","details":{"type":"jet","engines":4,"manufacturer":"Boeing"}}}
```

Post crawl:

show TABLES

g97068_firehose_sink_2

describe g97068_firehose_sink_2


specversion         	string              	from deserializer   
type                	string              	from deserializer   
source              	string              	from deserializer   
id                  	string              	from deserializer   
time                	string              	from deserializer   
comexampleextension1	string              	from deserializer   
comexampleothervalue	int                 	from deserializer   
unsetextension      	string              	from deserializer   
datacontenttype     	string              	from deserializer   
data                	struct<vtype:string,details:struct<doors:int,engine:string,enginetype:string,length:int,type:string,engines:int,manufacturer:string>>	from deserializer   
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string              	                    
partition_3         	string              	                    
	 	 
# Partition Information	 	 
# col_name            	data_type           	comment             
	 	 
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string              	                    
partition_3         	string        


Now you have a union... what happens if another type now shows up, perhaps with a conflicting type for an element definition:

```
{"specversion":"1.0","type":"transaction.completed","source":"/mycontext","id":"c1653f4c-1238-4922-aea6-8ba201323574","time":"2021-06-11-10:33:26:235PDT","comexampleextension1":"value","comexampleothervalue":5,"unsetextension":null,"datacontenttype":"application/json","data":{"txnid":"1278cacc-6f18-440b-b59d-00f5171775cf","details":{"type":7,"amount":4}}}
```

Run the crawler...

Describe the table again

specversion         	string              	from deserializer   
type                	string              	from deserializer   
source              	string              	from deserializer   
id                  	string              	from deserializer   
time                	string              	from deserializer   
comexampleextension1	string              	from deserializer   
comexampleothervalue	int                 	from deserializer   
unsetextension      	string              	from deserializer   
datacontenttype     	string              	from deserializer   
data                	struct<vtype:string,details:struct<doors:int,engine:string,enginetype:string,length:int,type:string,engines:int,manufacturer:string,amount:int>,txnid:string>	from deserializer   
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string              	                    
partition_3         	string              	                    
	 	 
# Partition Information	 	 
# col_name            	data_type           	comment             
	 	 
partition_0         	string              	                    
partition_1         	string              	                    
partition_2         	string              	                    
partition_3         	string   

Then query the table:

select * from g97068_firehose_sink_2 where type = 'transaction.completed'

1	1.0	transaction.completed	/mycontext	879a307f-8f49-4e9e-a85c-0c26545772b1	2021-06-11-10:28:22:651PDT	value	5		application/json	{vtype=null, details={doors=null, engine=null, enginetype=null, length=null, type=7, engines=null, manufacturer=null, amount=4}, txnid=6613d66f-39a9-44fe-8277-51a1d9117643}	2021	06	11	17
2	1.0	transaction.completed	/mycontext	da674022-66c9-42ca-a99f-dceec7f87a2c	2021-06-11-10:28:23:072PDT	value	5		application/json	{vtype=null, details={doors=null, engine=null, enginetype=null, length=null, type=7, engines=null, manufacturer=null, amount=4}, txnid=d11f3f45-ea76-48cd-94be-673f33c1202d}	2021	06	11	17


You cannot extract the original structure of the data element for the transaction.completed type without built in knowledge of the type structure at the time the object was written.

Also, consider the type attribute in data.details - for vehicle.registered the type is string, for transaction.completed the type is int. 

You can still query appropriately for vehicle.registered, e.g. 

select * from g97068_firehose_sink_2 where data.details.type = 'jet'

However you cannot use the native type for transaction.complete

select * from g97068_firehose_sink_2 where data.details.type = 7

SYNTAX_ERROR: line 1:62: '=' cannot be applied to varchar, integer

This query ran against the "cedb" database, unless qualified by the query. Please post the error message on our forum or contact customer support with Query Id: 80110866-9657-4647-962c-a2b16fc08504.

You can sort of overcome this by just using a string value, e.g.

select * from g97068_firehose_sink_2 where data.details.type = '7'

This will not work as expected however with doing comparisons, e.g.

$ node 
Welcome to Node.js v12.14.1.
Type ".help" for more information.
> "100000000000" < "9"
true


What can we conclude:

* As object hits the s3 bucket, they should be partitioned by event type if we want to query against event data.
* If we want to lookup by event id and/or date range, we should process the files when they hit the bucket into a queryable format e.g. cloudevents.io metadata attributes plus an attribute containing a base 64 encoded version of the data element.









