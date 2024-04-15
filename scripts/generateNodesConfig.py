import os
import json

os.environ['AWS_PAGER'] = 'cat'
data = os.popen(
    'aws ec2 describe-network-interfaces --query "NetworkInterfaces[*][].PrivateIpAddresses[*][].{Private:PrivateIpAddress, Public: Association.PublicIp}"').read()
ips = json.loads(data)
print(ips)
config = [{
    'ip': ip['Private'],
    'port': 2345
} for ip in ips]

with open('data/nodesConfig.json', 'w') as f:
    json.dump(config, f, indent=2)
