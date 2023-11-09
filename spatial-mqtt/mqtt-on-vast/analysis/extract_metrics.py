import re
import os
import csv
import sys
import pandas as pd
import matplotlib.pyplot as plt


# Function to extract all metrics from file content
def extract_values(contents):
    # Regex patterns for all the metrics
    metrics_patterns = {
        'number_of_brokers': re.compile(r'Number of brokers:\s+(\d+)'),
        'number_of_clients': re.compile(r'Number of clients:\s+(\d+)'),
        'duration_of_test': re.compile(r'Duration of test:\s+([\d.]+)\s+ms'),
        'number_of_events': re.compile(r'Number of events:\s+(\d+)'),
        'joins': re.compile(r'~Joins:\s+(\d+)'),
        'leaves': re.compile(r'~Leaves:\s+(\d+)'),
        'total_subscriptions': re.compile(r'~Total subscriptions:\s+(\d+)'),
        'active_subscriptions': re.compile(r'-Active subscriptions:\s+(\d+)'),
        'unsubscribes': re.compile(r'-Unsubscribes:\s+(\d+)'),
        'publications_sent': re.compile(r'~Publications sent:\s+(\d+)'),
        'ideal_publications_required': re.compile(r'~Ideal\s+-\s+Publications required:\s+(\d+)'),
        'actual_received_publications': re.compile(r'~Actual\s+-\s+Received publications:\s+(\d+)'),
        'type_1_error': re.compile(r'~Type 1 error\s+-\s+Missed publications:\s+(\d+)'),
        'type_2_error': re.compile(r'~Type 2 error\s+-\s+Duplicate publications:\s+(\d+)'),
        'type_3_error': re.compile(r'~Type 3 error\s+-\s+Unwanted publications:\s+(\d+)'),
        'latency': re.compile(r'Latency \(Average RTT\):\s+([\d.]+)\s+ms'),
        'latency_standard_deviation': re.compile(r'Standard Deviation of Latency:\s+([\d.]+)\s+ms'),
        'latency_variance': re.compile(r'Varience of Latency:\s+([\d.]+)\s+ms'),
        'consistency': re.compile(r'C\s+=\s+([\d.]+)'),
        'correctness': re.compile(r'K\s+=\s+([\d.]+)')
    }

    # Initialize a dictionary to hold the extracted values
    extracted_values = {metric: None for metric in metrics_patterns}

    # Iterate through the lines and match patterns
    for line in contents:
        for metric, pattern in metrics_patterns.items():
            match = pattern.search(line)
            if match:
                # Convert to appropriate data type
                if metric in ['latency', 'latency_standard_deviation', 'latency_variance', 'consistency', 'correctness', 'duration_of_test']:
                    extracted_values[metric] = float(match.group(1))
                else:
                    extracted_values[metric] = int(match.group(1))

    return extracted_values


# Function to write the extracted metrics to a CSV file
def write_to_csv(csv_file_name, fieldnames, rows):
    with open(csv_file_name, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for row in rows:
            writer.writerow(row)


# Function to process multiple files and save the extracted values to a single CSV
def process_files(file_paths):
    all_data = []
    fieldnames = []

    for file_path in file_paths:
        if os.path.isfile(file_path):
            with open(file_path, 'r') as file:
                contents = file.readlines()
            extracted_values = extract_values(contents)
            all_data.append(extracted_values)
            if not fieldnames:
                # This assumes all files will have the same fields
                fieldnames = list(extracted_values.keys())
        else:
            print(f"File not found: {file_path}")

    # Write all data to a single CSV file
    write_to_csv(base_path+'/aggregated_metrics.csv', fieldnames, all_data)


# Function to read CSV data into a DataFrame
def read_csv_to_dataframe(csv_file_name):
    return pd.read_csv(csv_file_name)


# Function to generate and save plots
def generate_plots(dataframe, base_path):
    # Define the plots
    plots_info = [
        ('latency', 'number_of_clients', 'Latency vs Number of Clients', 'latency_standard_deviation'),
        ('correctness', 'number_of_clients', 'Correctness vs Number of Clients', None),
        ('consistency', 'number_of_clients', 'Consistency vs Number of Clients', None),
    ]

    for y_column, x_column, title, std_dev_column in plots_info:
        plt.figure()
        
        if std_dev_column:
            # Sort the dataframe by the x_column to ensure the line plot is correct
            sorted_dataframe = dataframe.sort_values(by=x_column)
            plt.errorbar(sorted_dataframe[x_column], sorted_dataframe[y_column], yerr=sorted_dataframe[std_dev_column], fmt='-o', ecolor='lightgray', alpha=0.5, capsize=5)
            plt.fill_between(sorted_dataframe[x_column], sorted_dataframe[y_column] - sorted_dataframe[std_dev_column], sorted_dataframe[y_column] + sorted_dataframe[std_dev_column], color='lightgray', alpha=0.5)
            # Set axis limits and intervals
            plt.xlim([0, dataframe[x_column].max() + 1])  # x-axis limits
            plt.ylim([0, dataframe[y_column].max() + 20])  # y-axis limits
            plt.xticks(range(dataframe[x_column].min(), dataframe[x_column].max() + 1, 1))  # x-axis ticks
            
            plt.xlabel(x_column.replace('_', ' ').title())
            plt.ylabel(y_column.replace('_', ' ').title())
            plt.title(title)
            plt.grid(True)
            plt.savefig(f"{base_path}/{title.replace(' ', '_')}.png")
            plt.close()
        else:
            plt.scatter(dataframe[x_column], dataframe[y_column])
            # Optionally, you could create a line plot for the other metrics too
            # plt.plot(dataframe[x_column], dataframe[y_column], '-o')

            plt.xlim([0, dataframe[x_column].max() + 1])  # x-axis limits
            plt.ylim([0, 1.05])  # y-axis limits
            plt.xticks(range(0, dataframe[x_column].max() + 1, 1))  # x-axis ticks

            plt.xlabel(x_column.replace('_', ' ').title())
            plt.ylabel(y_column.replace('_', ' ').title())
            plt.title(title)
            plt.grid(True)
            plt.savefig(f"{base_path}/{title.replace(' ', '_')}.png")
            plt.close()
        



# Main function
def main(base_path):
    file_paths = [
        base_path + '/Output_1.txt',
        base_path + '/Output_2.txt',
        base_path + '/Output_3.txt',
        base_path + '/Output_4.txt',
        base_path + '/Output_5.txt',
        base_path + '/Output_6.txt',
        base_path + '/Output_7.txt',
        base_path + '/Output_8.txt',
        base_path + '/Output_9.txt',
        base_path + '/Output_10.txt',
        base_path + '/Output_11.txt',
        base_path + '/Output_12.txt',
        base_path + '/Output_13.txt',
        base_path + '/Output_14.txt',
        base_path + '/Output_15.txt',
        base_path + '/Output_16.txt',
        base_path + '/Output_17.txt',
        base_path + '/Output_18.txt',
        base_path + '/Output_19.txt',
        base_path + '/Output_20.txt',
        base_path + '/Output_21.txt',
    ]

    # Process the files
    process_files(file_paths)

    # After processing files, read the CSV and generate plots
    csv_file_name = base_path+'/aggregated_metrics.csv'
    dataframe = read_csv_to_dataframe(csv_file_name)
    generate_plots(dataframe, base_path)
# Example list of file paths (replace these with the actual file paths)


# Process the files
if __name__ == "__main__":
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = '.'  # Default to current directory if not provided
    main(base_path)
