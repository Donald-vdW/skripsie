import os
import pandas as pd
import matplotlib.pyplot as plt

# Specify the folder containing the CSV files
folder_path = '/mnt/d/User/Documents/4th Year/Semester2/Skripsie/TESTS/2/completeCSVs/'

# List all CSV files in the folder
csv_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]

# Read all CSV files into DataFrames
dfs = [pd.read_csv(os.path.join(folder_path, file)) for file in csv_files]

# Extracting the relevant columns ('number_of_clients' and 'latency') from each DataFrame
data = [(df['number_of_clients'], df['latency']) for df in dfs]

# Plotting the data with lines
plt.figure(figsize=(10, 6))

for i, (clients, latency) in enumerate(data):
    plt.plot(clients, latency, label=f'Dataset {i+1}', marker='o')

plt.xlabel('Number of Clients')
plt.ylabel('Latency')
plt.title('Clients vs Latency with different publication rates')
plt.xticks(range(int(min(clients)), int(max(clients)) + 1, 1))
plt.legend()
plt.grid(True)
plt.savefig(folder_path + 'plot.png')
