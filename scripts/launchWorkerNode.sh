#!/usr/bin/env bash

IP=$1
PORT=$2
NID=$3

# ssh -i ~/.ssh/aws.pem -o "StrictHostKeyChecking no" ec2-user@"${IP}" -f "cd ~/gitgitgo/store; cd \$(ls) ; cd main; rm -rf mr-46ce2075-6507-43a5-b07a-5573e680a7a7-reduce"

ssh -i ~/.ssh/aws.pem -o "StrictHostKeyChecking no" ec2-user@"${IP}" -f "screen -dm bash -c \"kill \$(lsof -t -i:${PORT}); cd ~/gitgitgo && git stash; git clean -d -f .; git pull; npm install && scripts/runWorker.sh ${PORT} ${NID} 2>&1 > ~/log \""
