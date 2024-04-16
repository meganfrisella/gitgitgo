#!/usr/bin/env bash

IP=$1
PORT=$2

ssh -i ~/.ssh/aws.pem -o "StrictHostKeyChecking no" ec2-user@"${IP}" -f "screen -dm bash -c \"kill \$(lsof -t -i:${PORT}); cd ~/gitgitgo && git stash; git clean -d -f .; git pull; npm install && scripts/runWorker.sh ${PORT} > ~/log 2>&1\""
