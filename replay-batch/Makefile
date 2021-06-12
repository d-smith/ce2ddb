build:
	docker build . -t replay2queue

push:
	docker tag replay2queue:latest ${ACCOUNT_NO}.dkr.ecr.us-east-1.amazonaws.com/replay2queue:latest
	docker push ${ACCOUNT_NO}.dkr.ecr.us-east-1.amazonaws.com/replay2queue:latest


