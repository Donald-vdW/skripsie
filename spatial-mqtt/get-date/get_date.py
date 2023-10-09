# get_date.py
import requests
from bs4 import BeautifulSoup


def get_date_time():
    url = 'https://www.timeanddate.com/'
    response = requests.get(url)
    if response.status_code != 200:
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract time and date from the website
    hour_minute = soup.find('span', id='clk_hm').text if soup.find('span', id='clk_hm') else ""
    seconds = soup.find('span', id='ij0').text if soup.find('span', id='ij0') else ""
    date = soup.find('span', id='ij2').text if soup.find('span', id='ij2') else ""

    # Convert the extracted date and time to the required format
    day, month_str, year = date.split()
    day = day.zfill(2)  # Ensure day is two digits
    month_dict = {'Jan':'01', 'Feb':'02', 'Mar':'03', 'Apr':'04', 'May':'05', 'Jun':'06', 'Jul':'07', 'Aug':'08', 'Sep':'09', 'Oct':'10', 'Nov':'11', 'Dec':'12'}
    formatted_date_time = month_dict[month_str] + day + hour_minute.replace(':', '') + year + "." + seconds

    return formatted_date_time

if __name__ == "__main__":
    date_time = get_date_time()
    if date_time:
        print(date_time)
    else:
        print("Error fetching date and time")
