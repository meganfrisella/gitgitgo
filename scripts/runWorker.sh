#!/usr/bin/env bash

PORT=${1:-2345}
IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep . | grep -v '127.0.0.1' | head -n1)

node distribution.js --ip "${IP}" --port "${PORT}"
