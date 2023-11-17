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
NON_SPATIAL = 13


# Analysis variables
# Subs
spatial_subs = []
non_spatial_subs = []
spatial_unsubs = []
non_spatial_unsubs = []
old_spatial_subs = []
old_non_spatial_subs = []

# Pubs
sent_spatial_pubs = []
sent_non_spatial_pubs = []

correct_spatial_pubs = []
correct_non_spatial_pubs = []

req_spatial_pubs = []
req_non_spatial_pubs = []

unwanted_spatial_pubs = []
unwanted_non_spatial_pubs = []

dup_spatial_pubs = []
dup_non_spatial_pubs = []

missed_spatial_pubs = []
missed_non_spatial_pubs = []

received_spatial_pubs = []
received_non_spatial_pubs = []

unlinked_spatial_pubs = []
unlinked_non_spatial_pubs = []

# Clients
active_clients = []
left_clients = []

# Brokers
brokers = []

# Test
spatial_round_trip_times = []
non_spatial_rtt = []
test_duration = 0
total_spatial_round_trip_time = 0
total_non_spatial_rtt = 0
num_spatial_round_trip_time = 0
num_non_spatial_rtt = 0


# Read the file and store events with their timestamps
# log_filename = "/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/100ps-pub-to-own-sub/1Client_events.txt"  # Replace with your log file's name
events = []


# Check if at least one argument has been passed
if len(sys.argv) > 1:
    log_filename = sys.argv[1]
    print(f"The filename passed is: {log_filename}")
else:
    print("No filename passed.")


# Helper function to check if two AOIs overlap
def do_aois_overlap(aoi1, aoi2):
    '''
    Circular areas of interest overlap if their
    centers are within each other's radii.

    Function returns True if the AOIs overlap, False otherwise.
    '''
    distance = (
        (aoi1['center']['x'] - aoi2['center']['x'])**2 +
        (aoi1['center']['y'] - aoi2['center']['y'])**2
    )**0.5  # Euclidean distance between centers
    return distance < (aoi1['radius'] + aoi2['radius'])


def find_subscription_by_subid(subid_to_find):
    # Iterate through each subscription in the list
    for subscription in spatial_subs:
        # Check if the subID matches the one we're looking for
        if subscription['subID'] == subid_to_find:
            return subscription  # Return the matching subscription
    return None  # Return None if no match is found


def find_unsubscription_by_subid(unsubid_to_find):
    # Iterate through each unsubscription in the list
    for unsub in spatial_unsubs:
        # Check if the subID matches the one we're looking for
        if unsub['subID'] == unsubid_to_find:
            return unsub  # Return the matching unsubscription
    return None  # Return None if no match is found


def spatial_unsubscribe_by_subid(subid_to_delete):
    # Iterate through each subscription in the list
    for subscription in spatial_subs:
        # Check if the subID matches the one we're looking for
        if subscription['subID'] == subid_to_delete:
            old_spatial_subs.append(subscription)
            spatial_subs.remove(subscription)
            return  # Return the matching subscription
    return None  # Return None if no match is found


def non_spatial_unsubscribe_by_topic(topic_to_delete, clientID):
    # Iterate through each subscription in the list
    for subscription in non_spatial_subs:
        # Check if the subID matches the one we're looking for
        if subscription['topic'] == topic_to_delete and subscription['clientID'] == clientID:
            old_non_spatial_subs.append(subscription)
            non_spatial_subs.remove(subscription)
            return  # Return the matching subscription
    return None  # Return None if no match is found


def add_required_spatial(pubID, channel, aoi, time):
    # For all subscriptions check for overlap and channel match
    for sub in spatial_subs:
        if do_aois_overlap(sub['aoi'], aoi) and sub['channel'] == channel:
            req_spatial_pubs.append({
                'time': time,  # Time of subscription
                'subID': sub['subID'],
                'pubID': pubID,
                'delivered': False
            })
    return


def add_required_non_spatial(pubID, topic, time):
    # For all subscriptions check for overlap and channel match
    for sub in non_spatial_subs:
        if sub['topic'] == topic:
            req_non_spatial_pubs.append({
                'time': time,  # Time of subscription
                'topic': sub['topic'],
                'pubID': pubID,
                'delivered': False
            })
    return


def find_spatial_subscriber_by_subid(subid_to_find):
    # Iterate through each subscription in the list
    for subscription in spatial_subs:
        # Check if the subID matches the one we're looking for
        if subscription['subID'] == subid_to_find:
            return subscription['clientID']  # Return the matching subscription
    return None  # Return None if no match is found


def find_spatial_publication_by_pubid(pubid_to_find):
    # Iterate through each publication in the list
    for publication in sent_spatial_pubs:
        # Check if the pubID matches the one we're looking for
        if publication['pubID'] == pubid_to_find:
            return publication  # Return the matching publication
    return None  # Return None if no match is found


def find_non_spatial_publication_by_pubid(pubid_to_find):
    # Iterate through each publication in the list
    for publication in sent_non_spatial_pubs:
        # Check if the pubID matches the one we're looking for
        if publication['pubID'] == pubid_to_find:
            return publication  # Return the matching publication
    return None  # Return None if no match is found


with open(log_filename, 'r') as file:
    for line in file:
        event = json.loads(line.strip())
        events.append(event)

# Sort events by the 'time' key
events.sort(key=lambda x: x['time'])

# Now handle the sorted events
for event in events:

    if event['event'] == CLIENT_JOINS:  # Client joins
        active_clients.append(event)
        # Add broker to array of brokers if it doesn't exist
        broker_exists = False
        for broker in brokers:
            if broker == event['matcher']:
                broker_exists = True
                break
        if not broker_exists:
            brokers.append(event['matcher'])

    elif event['event'] == CLIENT_LEAVES:  # Client leaves
        left_clients.append(event)
        # write code to remove client from active_clients
        for client in active_clients:
            if client['id'] == event['id']:
                active_clients.remove(client)
                break

    elif event['event'] == CLIENT_SUBSCRIBES:  # New subscription
        spatial_subs.append({
            'time': event['time'],
            'clientID': event['sub']['clientID'],
            'subID': event['sub']['subID'],
            'channel': event['sub']['channel'],
            'aoi': event['sub']['aoi']
        })

    elif event['event'] == CLIENT_UNSUBSCRIBES:  # Unsubscription
        spatial_unsubs.append(event)
        spatial_unsubscribe_by_subid(event['subID'])

    elif event['event'] == CLIENT_PUBLISHES:  # Publication sent
        pubID = event['pub']['pubID']
        channel = event['pub']['channel']
        aoi = event['pub']['aoi']
        time = event['time']

        sent_spatial_pubs.append({
            'time': time,
            'clientID': event['id'],
            'pubID': pubID,
            'channel': channel,
            'aoi': aoi
        })

        add_required_spatial(pubID, channel, aoi, time)

    elif event['event'] == CLIENT_RECEIVES:  # Publication received
        received_spatial_pubs.append(event)
        # handle_received_pub(event, matching_sent_pub)

        # Add this message to the list of received messages
    elif event['event'] == TEST_ENDS:
        test_duration = event['time']

    # {"time":0.23319999873638153,"event":13,"non_spatial_event":6,"id":"mqttjs_b310c175","alias":"C1","broker":"localhost","sub":"Topic10"}
    elif event['event'] == NON_SPATIAL:
        # print(event)
        if event['non_spatial_event'] == CLIENT_SUBSCRIBES:
            non_spatial_subs.append({
                'time': event['time'],
                'clientID': event['id'],
                'topic': event['sub']
            })
        elif event['non_spatial_event'] == CLIENT_UNSUBSCRIBES:
            non_spatial_unsubs.append(event)
            non_spatial_unsubscribe_by_topic(event['topic'], event['id'])
        elif event['non_spatial_event'] == CLIENT_PUBLISHES:
            sent_non_spatial_pubs.append({
                'time': event['time'],
                'clientID': event['id'],
                'pubID': event['pubID'],
                'topic': event['topic']
            })
            add_required_non_spatial(event['pubID'], event['topic'], event['time'])

        elif event['non_spatial_event'] == CLIENT_RECEIVES:
            received_non_spatial_pubs.append(event)


for received_pub in received_spatial_pubs:
    matching_sent_pub = find_spatial_publication_by_pubid(received_pub['pub']['pubID'])

    if matching_sent_pub is None:
        unlinked_spatial_pubs.append(received_pub)
        continue
    else:
        if (received_pub['time'] > 10000) and (matching_sent_pub['clientID'] == received_pub['id']):
            spatial_round_trip_time = received_pub['time'] - matching_sent_pub['time']
            total_spatial_round_trip_time += spatial_round_trip_time
            spatial_round_trip_times.append(spatial_round_trip_time)
            num_spatial_round_trip_time += 1
        # Ignore all pubs sent before the system is in steady state
        received_message = {
            'sent_time': matching_sent_pub['time'],
            'receive_time': received_pub['time'],
            'receiver': received_pub['id'],
            'sender': find_spatial_subscriber_by_subid(received_pub['pub']['subID']),
            'pub_id': received_pub['pub']['pubID'],
            'sub_id': received_pub['pub']['subID'],
            'message': received_pub['pub']['payload'],
            'correct': False
        }

        # go through the list of required publications
        found = False
        for req_pub in req_spatial_pubs:
            # Check if the subID and pubID match
            if (req_pub['subID'] == received_pub['pub']['subID'] and req_pub['pubID'] == received_pub['pub']['pubID']):
                if not found:
                    req_pub['delivered'] = found = True
                    correct_spatial_pubs.append(received_message)
                else:
                    dup_spatial_pubs.append(received_message)
                    print('Duplicate publication: ', received_message)
                    # Remove it from the list of received publications

        if not found:
            print('Received publication not required: ', received_message)
            unwanted_spatial_pubs.append(received_message)


for received_pub in received_non_spatial_pubs:
    # print(received_pub)
    matching_sent_pub = find_non_spatial_publication_by_pubid(received_pub['pubID'])

    if matching_sent_pub is None:
        unlinked_spatial_pubs.append(received_pub)
        continue
    else:
        if (received_pub['time'] > 000) and (matching_sent_pub['clientID'] == received_pub['id']):
            non_spatial_round_trip_time = received_pub['time'] - matching_sent_pub['time']
            total_non_spatial_rtt += non_spatial_round_trip_time
            non_spatial_rtt.append(non_spatial_round_trip_time)
            num_non_spatial_rtt += 1
        # Ignore all pubs sent before the system is in steady state
        received_message = {
            'sent_time': matching_sent_pub['time'],
            'receive_time': received_pub['time'],
            'receiver': received_pub['id'],
            'sender': matching_sent_pub['clientID'],
            'pub_id': received_pub['pubID'],
            'topic': received_pub['topic'],
            'message': received_pub['msg'],
            'correct': False
        }

        # go through the list of required publications
        found = False
        for req_pub in req_non_spatial_pubs:
            # Check if the subID and pubID match
            if (req_pub['topic'] == received_pub['topic'] and req_pub['pubID'] == received_pub['pubID']):
                if not found:
                    req_pub['delivered'] = found = True
                    correct_non_spatial_pubs.append(received_message)
                else:
                    dup_non_spatial_pubs.append(received_message)
                    # print('Duplicate publication: ', received_message)
                    # Remove it from the list of received publications

        if not found:
            print('Received publication not required: ', received_message)
            unwanted_non_spatial_pubs.append(received_message)


# Print a message with all the missed publications
for req_pub in req_spatial_pubs:
    if not req_pub['delivered']:
        # print('Missed publication: ', req_pub)
        missed_spatial_pubs.append(req_pub)


for req_pub in req_non_spatial_pubs:
    if not req_pub['delivered']:
        # print('Missed publication: ', req_pub)
        missed_non_spatial_pubs.append(req_pub)

# Print the results
print('Number of brokers: ', len(brokers))
print('Number of clients: ', len(active_clients)+len(left_clients))
print('Duration of test: ', test_duration, ' ms')
print('Number of events: ', len(events))
print('\t~Joins: ', len(active_clients)+len(left_clients))
print('\t~Leaves: ', len(left_clients))

print('Spatial Results')
print('======================================')
print('\t~Total subscriptions: ', len(spatial_subs) + len(old_spatial_subs))
print('\t\t-Active subscriptions: ', len(spatial_subs))
if (len(spatial_subs) > 0):
    for sub in spatial_subs:
        print('\t\t\t', sub['subID'], ' ', sub['aoi'])

print('\t\t-Unsubscribes: ', len(spatial_unsubs))
print('\t~Publications sent: ', len(sent_spatial_pubs))
print('\t~Ideal  - Publications required: ', len(req_spatial_pubs))
print('\t~Actual - Received publications: ', len(correct_spatial_pubs))
print('\t~Type 1 error - Missed publications: ', len(missed_spatial_pubs))
if (len(missed_spatial_pubs) > 0):
    for missed_pub in missed_spatial_pubs:
        print('\t\t', missed_pub)

print('\t~Type 2 error - Duplicate publications: ', len(dup_spatial_pubs))
if (len(dup_spatial_pubs) > 0):
    for dup_pub in dup_spatial_pubs:
        print('\t\t', dup_pub)

print('\t~Type 3 error - Unwanted publications: ', len(unwanted_spatial_pubs))
if (len(unwanted_spatial_pubs) > 0):
    for unwanted_pub in unwanted_spatial_pubs:
        print('\t\t', unwanted_pub)

if num_spatial_round_trip_time > 0:
    mean_round_trip_time = total_spatial_round_trip_time / num_spatial_round_trip_time
    squared_diffs = [(x - mean_round_trip_time) ** 2 for x in spatial_round_trip_times]
    variance = sum(squared_diffs) / num_spatial_round_trip_time
    std_deviation = variance ** 0.5
    print('Latency (Average RTT): ', mean_round_trip_time, ' ms')
    print('Standard Deviation of Latency: ', std_deviation, 'ms')
    print('Variance of Latency: ', variance, 'ms')

if len(req_spatial_pubs) > 0:
    print('C = ', len(correct_spatial_pubs) / len(req_spatial_pubs))
    print('K = ', len(req_spatial_pubs) / (len(req_spatial_pubs) + len(missed_spatial_pubs)+len(dup_spatial_pubs)+len(unwanted_spatial_pubs)))
print('======================================')
# print('Non-Spatial Results')
# print('======================================')
# print('\t~Total subscriptions: ', len(non_spatial_subs) + len(old_non_spatial_subs))
# print('\t\t-Active subscriptions: ', len(non_spatial_subs))
# if (len(non_spatial_subs) > 0):
#     for sub in non_spatial_subs:
#         print('\t\t\t', sub['topic'])

# print('\t\t-Unsubscribes: ', len(non_spatial_unsubs))
# print('\t~Publications sent: ', len(sent_non_spatial_pubs))
# print('\t~Ideal  - Publications required: ', len(req_non_spatial_pubs))
# print('\t~Actual - Received publications: ', len(correct_non_spatial_pubs))
# print('\t~Type 1 error - Missed publications: ', len(missed_non_spatial_pubs))
# # if (len(missed_non_spatial_pubs) > 0):
# #     for missed_pub in missed_non_spatial_pubs:
# #         print('\t\t', missed_pub)

# print('\t~Type 2 error - Duplicate publications: ', len(dup_non_spatial_pubs))
# # if (len(dup_non_spatial_pubs) > 0):
# #     for dup_pub in dup_non_spatial_pubs:
# #         print('\t\t', dup_pub)

# print('\t~Type 3 error - Unwanted publications: ', len(unwanted_non_spatial_pubs))
# if (len(unwanted_non_spatial_pubs) > 0):
#     for unwanted_pub in unwanted_non_spatial_pubs:
#         print('\t\t', unwanted_pub)

# if num_non_spatial_rtt > 0:
#     mean_rtt = total_non_spatial_rtt / num_non_spatial_rtt
#     squared_diffs = [(x - mean_rtt) ** 2 for x in non_spatial_rtt]
#     variance = sum(squared_diffs) / num_non_spatial_rtt
#     std_deviation = variance ** 0.5
#     print('Latency (Average RTT): ', mean_rtt, ' ms')
#     print('Standard Deviation of Latency: ', std_deviation, 'ms')
#     print('Variance of Latency: ', variance, 'ms')

# if len(req_non_spatial_pubs) > 0:
#     print('C = ', len(correct_non_spatial_pubs) / len(req_non_spatial_pubs))
#     print('K = ', len(req_non_spatial_pubs) / (len(req_non_spatial_pubs) + len(missed_non_spatial_pubs)+len(dup_non_spatial_pubs)+len(unwanted_non_spatial_pubs)))
