# replay to queue

Using AWS batch, replay events to queue

## Docker and ECR Notes

Build the image:

docker build . -t replay2queue

Create an ECR repository

aws ecr create-repository --repository-name replay2queue

Login

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_NO.dkr.ecr.us-east-1.amazonaws.com

Tag it 

docker tag replay2queue:latest $ACCOUNT_NO.dkr.ecr.us-east-1.amazonaws.com/replay2queue:latest


Push it

docker push $ACCOUNT_NO.dkr.ecr.us-east-1.amazonaws.com/replay2queue:latest

## Batch Notes

Create a role in IAM console - ecr, clooud watch logs, 



Created compute environment and job queue via the console. Added private endpoints for ecr api and dkr.

NOTE: Note - need PassRole when running this...

aws batch register-job-definition \
--job-definition-name queue-replay-job \
--type container \
--platform-capabilities "FARGATE" \
--container-properties '{"image":"$ACCOUNT_NO.dkr.ecr.us-east-1.amazonaws.com/replay2queue:latest","environment":[{"name":"x","value":"xv"}], "resourceRequirements":[{"type":"VCPU","value":"0.25"},{"type":"MEMORY","value":"512"}], "networkConfiguration": {"assignPublicIp":"ENABLED"}, "executionRoleArn":"arn:aws:iam::$ACCOUNT_NO:role/queue-replay-batch-role"}'

Note - add jobRoleArn too?

Submit a job

aws batch submit-job \
--job-name j1 \
--job-queue jobQueue1 \
--job-definition queue-replay-job \
--container-overrides '{"environment":[{"name":"type","value":"com.example.someevent"},{"name":"startDate","value":"2021-06-02-06:15"},{"name":"endDate","value":"2021-06-02-10:15"},{"name":"queue","value":"xxx"}]}'

## Replay

create a queue

aws sqs create-queue --queue-name replay

## Learnings

* vpc endpoints in private vpc
* assign public ip address
* execution and job role distinction
* update cli version
