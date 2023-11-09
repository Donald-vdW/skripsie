import json
from collections import defaultdict
import sys

# create definitions for events
CLIENT_JOINS = 0
CLIENT_LEAVES = 1
CLIENT_SUBSCRIBES = 6
CLIENT_UNSUBSCRIBES = 8
CLIENT_PUBLISHES = 9
CLIENT_RECEIVES = 10
TEST_ENDS = 12 

# Using defaultdict to avoid key errors and for efficient aggregation
subs = defaultdict(dict)
unsubs = defaultdict(bool)
sent_pubs = defaultdict(dict)
required_pubs = defaultdict(list)
received_pubs = defaultdict(list)
active_clients = set()
left_clients = set()
brokers = set()
round_trip_times = []

test_duration = 0
total_round_trip_time = 0
num_round_trip_time = 0

# Check if at least one argument has been passed
if len(sys.argv) > 1:
    log_filename = sys.argv[1]
    print(f"The filename passed is: {log_filename}")
else:
    print("No filename passed.")

# Helper function to check if two AOIs overlap
def do_aois_overlap(aoi1, aoi2):
    distance = (
        (aoi1['center']['x'] - aoi2['center']['x'])**2 +
        (aoi1['center']['y'] - aoi2['center']['y'])**2
    )**0.5  # Euclidean distance between centers
    return distance < (aoi1['radius'] + aoi2['radius'])

def add_required(pubID, channel, aoi, time):
    for subID, sub in subs.items():
        if do_aois_overlap(sub['aoi'], aoi) and sub['channel'] == channel:
            required_pubs[subID].append({
                'time': time,  # Time of publication
                'pubID': pubID,
                'delivered': False
            })

def process_event(event):
    global test_duration, total_round_trip_time, num_round_trip_time

    if event['event'] == CLIENT_JOINS:
        active_clients.add(event['id'])
        brokers.add(event['matcher'])

    elif event['event'] == CLIENT_LEAVES:
        left_clients.add(event['id'])
        active_clients.discard(event['id'])  # Efficiently remove client

    elif event['event'] == CLIENT_SUBSCRIBES:
        subs[event['sub']['subID']] = event['sub']

    elif event['event'] == CLIENT_UNSUBSCRIBES:
        unsubs[event['subID']] = True  # Mark as unsubscribed

    elif event['event'] == CLIENT_PUBLISHES:
        print(event)
        sent_pubs[event['pub']['pubID']] = event['pub']
        add_required(event['pub']['pubID'], event['pub']['channel'], event['pub']['aoi'], event['time'])

    elif event['event'] == CLIENT_RECEIVES:
        received_pubs[event['pub']['subID']].append({
            'time': event['time'],
            'pubID': event['pub']['pubID']
        })
        # If the publication is linked to a sent publication, calculate round trip time
        if event['pub']['pubID'] in sent_pubs:
            pub_time = sent_pubs[event['pub']['pubID']]['time']
            round_trip_time = event['time'] - pub_time
            round_trip_times.append(round_trip_time)
            total_round_trip_time += round_trip_time
            num_round_trip_time += 1

    elif event['event'] == TEST_ENDS:
        test_duration = event['time']

# Read the file and process events
with open(log_filename, 'r') as file:
    events = [json.loads(line.strip()) for line in file]
    events.sort(key=lambda x: x['time'])  # Sort events by the 'time' key

for event in events:
    process_event(event)

# Post-process to calculate statistics
correct_pubs = []
dup_pubs = []
unwanted_pubs = []
missed_pubs = []

# Check each required publication to see if it was delivered
for subID, pubs in required_pubs.items():
    for req_pub in pubs:
        if any(pub for pub in received_pubs[subID] if pub['pubID'] == req_pub['pubID']):
            req_pub['delivered'] = True
            correct_pubs.append(req_pub)
        else:
            missed_pubs.append(req_pub)

# Identify duplicates and unwanted publications
for subID, pubs in received_pubs.items():
    seen_pubs = set()
    for pub in pubs:
        if pub['pubID'] in seen_pubs:
            dup_pubs.append(pub)
        elif not subs[subID] or subID in unsubs:
            unwanted_pubs.append(pub)
        seen_pubs.add(pub['pubID'])

# Calculate statistics
mean_round_trip_time = total_round_trip_time / num_round_trip_time if num_round_trip_time else 0
variance = sum((x - mean_round_trip_time) ** 2 for x in round_trip_times) / num_round_trip_time if num_round_trip_time else 0
std_deviation = variance ** 0.5

# Print the results
print('Number of brokers:', len(brokers))
print('Number of clients:', len(active_clients) + len(left_clients))
print('Duration of test:', test_duration, 'ms')
print('Number of events:', len(events))
print('Total subscriptions:', len(subs))
print('Active subscriptions:', len(subs) - len(unsubs))
print('Publications sent:', len(sent_pubs))
print('Publications required:', sum(len(pubs) for pubs in required_pubs.values()))
print('Received publications:', len(correct_pubs))
print('Missed publications:', len(missed_pubs))
print('Duplicate publications:', len(dup_pubs))
print('Unwanted publications:', len(unwanted_pubs))
print('Latency (Average RTT):', mean_round_trip_time, 'ms')
print('Standard Deviation of Latency:', std_deviation, 'ms')
print('Variance of Latency:', variance, 'ms')

if num_round_trip_time:
    print('C =', len(correct_pubs) / sum(len(pubs) for pubs in required_pubs.values()))
    print('K =', sum(len(pubs) for pubs in required_pubs.values()) / (len(correct_pubs) + len(missed_pubs) + len(dup_pubs) + len(unwanted_pubs)))
