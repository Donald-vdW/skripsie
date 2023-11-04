import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import math


def circle_inside_circle(c1, c2):
    """
    Check if circle c1 is completely inside circle c2.
    c1: potential inner circle
    c2: potential outer circle
    """
    distance_centers = math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)
    return distance_centers + c1[2] <= c2[2]


def remove_redundant_subscriptions(subscriptions):
    non_redundant_subs = []
    for i, sub1 in enumerate(subscriptions):
        redundant = False
        for j, sub2 in enumerate(subscriptions):
            if (
                i != j and
                circle_inside_circle(sub1, sub2) and
                sub1[3] == sub2[3]
            ):
                redundant = True
                break
        if not redundant:
            non_redundant_subs.append(sub1)
    return non_redundant_subs


def read_aois(filename):
    aois = []
    with open(filename, 'r') as f:
        for line in f:
            x, y, radius, channel = line.strip().split(',')
            aois.append((float(x), float(y), float(radius), channel))
    return aois


def plot_aois(aois, aoi_type, specific_channel):
    channel_colors = {
        "channel1": "green" if aoi_type == 'subscription' else "red",
        "channel2": "green" if aoi_type == 'subscription' else "red",
        "channel3": "green" if aoi_type == 'subscription' else "red"
    }
    for x, y, radius, channel in aois:
        # Only plot AOIs of the specified channel
        if channel == specific_channel:
            color = channel_colors.get(channel, "black")
            circle = patches.Circle(
                (x, y),
                radius,
                fc=color,
                alpha=0.2,  # 50% opacity
                edgecolor=color
            )
            plt.gca().add_patch(circle)


def circles_overlap(c1, c2):
    # Calculate the distance between the centers of two circles
    distance = math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)
    return distance < (c1[2] + c2[2])


def main():
    channels = ["channel1", "channel2", "channel3"]
    overlap_counts = {channel: 0 for channel in channels}

    for channel in channels:
        plt.figure()  # Create a new figure for each channel

        if os.path.exists("subscriptions.txt"):
            subscriptions = read_aois("subscriptions.txt")
            # subscriptions = remove_redundant_subscriptions(subscriptions)
            plot_aois(subscriptions, 'subscription', channel)
        else:
            print("subscriptions.txt does not exist. Skipping.")

        if os.path.exists("publications.txt"):
            publications = read_aois("publications.txt")
            plot_aois(publications, 'publication', channel)
        else:
            print("publications.txt does not exist. Skipping.")

        # Check overlapping AOIs for the given channel
        for sub in subscriptions:
            for pub in publications:
                if sub[3] == pub[3] == channel and circles_overlap(sub, pub):
                    overlap_counts[channel] += 1
                    print(f"Subscription AOI at ({sub[0]}, {sub[1]}) overlaps "
                          f"with Publication AOI at ({pub[0]}, {pub[1]}) on "
                          f"{channel}.")

        plt.xlim(-50, 305)
        plt.ylim(-50, 305)
        plt.gca().set_aspect('equal', adjustable='box')
        # Add title and legend to the plot
        plt.title(f"Overlaps for {channel}")
        green_patch = patches.Patch(
            color='green',
            label='Subscription',
            alpha=0.2
        )
        red_patch = patches.Patch(color='red', label='Publication', alpha=0.2)
        plt.legend(handles=[green_patch, red_patch])
        # Save as a separate PNG for each channel
        plt.savefig(f'output_{channel}.png')

    # Print the overlap counts for each channel
    for channel, count in overlap_counts.items():
        print(f"Number of overlaps on {channel}: {count}")


if __name__ == "__main__":
    main()
