#!/usr/bin/env python3

import os
import json
import hashlib

os.environ['AWS_PAGER'] = 'cat'
data = os.popen(
    'aws ec2 describe-network-interfaces --query "NetworkInterfaces[*][].PrivateIpAddresses[*][].{Private:PrivateIpAddress, Public: Association.PublicIp}"').read()
ips = json.loads(data)
config = [{
    'ip': ip['Public'],
    'port': 2345,
    'nid': hashlib.sha256(ip['Private'].encode()).hexdigest()
} for ip in ips if ip['Public'] is not None]
config.sort(key=lambda x: x['nid'])

with open('data/nodesConfig.json', 'w') as f:
    json.dump(config, f, indent=2)
