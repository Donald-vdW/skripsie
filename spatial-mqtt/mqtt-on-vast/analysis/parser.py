import json
from collections import defaultdict, Counter

# Helper function to check if two AOIs overlap
def do_aois_overlap(aoi1, aoi2):
    distance = ((aoi1['center']['x'] - aoi2['center']['x'])**2 + (aoi1['center']['y'] - aoi2['center']['y'])**2)**0.5
    return distance < (aoi1['radius'] + aoi2['radius'])

# Initialize counters
event_counter = defaultdict(int)
client_ids = set()
subscription_ids = set()
publication_ids = set()
received_publications = defaultdict(set)  # Mapping of subID to received pubIDs

# Read the file
log_filename = '../logs_and_events/Client_events.txt'  # Replace with your log file's name

with open(log_filename, 'r') as file:
    for line in file:
        event = json.loads(line.strip())
        
        event_counter[event['event']] += 1

        if event['event'] == 0:  # Client joins
            client_ids.add(event['id'])

        elif event['event'] == 1:  # Client leaves
            client_ids.discard(event['id'])

        elif event['event'] == 6:  # New subscription
            subscription_ids.add(event['sub']['subID'])

        elif event['event'] == 8:  # Unsubscription
            subscription_ids.discard(event['subID'])
            event_counter['unsubscriptions'] += 1

        elif event['event'] == 9:  # Publication sent
            publication_ids.add(event['pub']['pubID'])

        elif event['event'] == 10:  # Publication received
            sub_id = event['pub']['subID']
            pub_id = event['pub']['pubID']
            received_publications[sub_id].add(pub_id)

# Calculate errors
subscriptions = defaultdict(dict)  # Holds the subscription AOIs
publications = {}  # Holds the publication AOIs

# Go through the file again to find publications and subscriptions
with open(log_filename, 'r') as file:
    for line in file:
        event = json.loads(line.strip())

        if event['event'] == 6:  # New subscription
            subscriptions[event['sub']['subID']] = event['sub']['aoi']

        elif event['event'] == 9:  # Publication sent
            publications[event['pub']['pubID']] = event['pub']['aoi']

# Now go through received publications and check for errors
correct_deliveries = 0
type_3_errors = 0  # Unwanted deliveries

for sub_id, pub_ids in received_publications.items():
    for pub_id in pub_ids:
        if do_aois_overlap(subscriptions[sub_id], publications[pub_id]):
            correct_deliveries += 1
        else:
            type_3_errors += 1

# Calculate type 1 and type 2 errors
type_1_errors = sum(len(pub_ids) for pub_ids in received_publications.values()) - correct_deliveries

# Initialize counter for type 2 errors (duplicate deliveries)
duplicate_deliveries_per_sub = defaultdict(int)

# Calculate type 2 errors by counting duplicates per subscription
for sub_id, pub_ids in received_publications.items():
    pub_count = Counter(pub_ids)  # Count occurrences of each pub_id for the sub_id
    for count in pub_count.values():
        if count > 1:  # If there's more than one of the same pub_id, it's a duplicate
            duplicate_deliveries_per_sub[sub_id] += count - 1  # Subtract 1 because the first delivery is not a duplicate

type_2_errors = sum(duplicate_deliveries_per_sub.values())

# Output the summary
summary = f"""
Number of events: {sum(event_counter.values())}
Number of clients: {len(client_ids)}
Number of subscriptions made (including updates): {len(subscription_ids)}
Number of subscription updates: {event_counter[6] - len(subscription_ids)}  # Assuming an update is a new sub event for an existing ID
Number of unsubscriptions: {event_counter['unsubscriptions']}
Number of publications sent: {len(publication_ids)}
Number of required publication deliveries: {correct_deliveries}  # Ideal number of deliveries without errors
Number of publications correctly delivered: {correct_deliveries}
Number of type 1 errors (missed deliveries): {type_1_errors}
Number of type 2 errors (duplicate deliveries): {type_2_errors}
Number of type 3 errors (unwanted deliveries): {type_3_errors}
"""

print(summary)
