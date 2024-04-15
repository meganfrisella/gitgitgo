#!/usr/bin/env python3

import os
import json
from argparse import ArgumentParser

parser = ArgumentParser()
parser.add_argument('--config', type=str, default='data/nodesConfig.json')

args = parser.parse_args()
with open(args.config, 'r') as f:
    data = json.load(f)

for node in data:
    print("Launching worker node", node['ip'])
    os.system(f"./scripts/launchWorkerNode.sh {node['ip']} {node['port']} &")

os.system("wait")
