#!/usr/bin/env bash

IP=$1
PORT=$2
NID=$3

ssh -i ~/.ssh/aws.pem -o "StrictHostKeyChecking no" ec2-user@"${IP}" -f "cd ~/gitgitgo/store; cd \$(ls) ; cd main; rm -rf mr-bdd6c1c0-997f-49bd-9472-b0b90764e8f0-map"

ssh -i ~/.ssh/aws.pem -o "StrictHostKeyChecking no" ec2-user@"${IP}" -f "screen -dm bash -c \"kill \$(lsof -t -i:${PORT}); cd ~/gitgitgo && git stash; git clean -d -f .; git pull; npm install && scripts/runWorker.sh ${PORT} ${NID} 2>&1 > ~/log \""
