import requests
from bs4 import BeautifulSoup
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Configuration
BASE_URL = "https://www.nlrb.gov"
LIST_URL = f"{BASE_URL}/reports/graphs-data/recent-filings"
TARGET_DATE = datetime.now().strftime("%m/%d/%Y") # Or yesterday

def get_union_from_case(case_url):
    try:
        res = requests.get(case_url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        # Look for the Parties table
        parties_section = soup.find('div', id='block-nlrb-main-content')
        rows = parties_section.find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 2:
                role = cols[0].get_text(strip=True)
                # 'Petitioner' for R cases, 'Charging Party' for C cases
                if "Petitioner" in role or "Charging Party" in role:
                    return cols[1].get_text(strip=True)
    except Exception as e:
        return "Unknown Union"
    return "Not listed"

def scrape_filings():
    response = requests.get(LIST_URL, timeout=15)
    soup = BeautifulSoup(response.text, 'html.parser')
    filings = []
    
    # Locate rows in the main filings table
    for row in soup.find_all('div', class_='views-row'):
        # This selector depends on the current site layout
        # We extract Case Number, Employer, and Date
        text = row.get_text()
        if TARGET_DATE in text:
            case_link = row.find('a', href=True)
            if case_link and "/case/" in case_link['href']:
                case_no = case_link.text.strip()
                full_url = BASE_URL + case_link['href']
                employer = row.find('div', class_='field--name-title').text.strip()
                
                print(f"Fetching details for {case_no}...")
                union = get_union_from_case(full_url)
                
                filings.append({
                    "case": case_no,
                    "employer": employer,
                    "union": union,
                    "url": full_url
                })
    return filings

def send_email(content):
    msg = MIMEMultipart()
    msg['Subject'] = f"NLRB Daily Filings Summary - {TARGET_DATE}"
    msg['From'] = os.environ['EMAIL_USER']
    msg['To'] = os.environ['EMAIL_RECEIVER']
    
    body = "Recent NLRB Filings Identified:\n\n"
    for f in content:
        body += f"Employer: {f['employer']}\nUnion: {f['union']}\nCase: {f['case']}\nLink: {f['url']}\n\n---\n"
    
    if not content:
        body = "No new filings found for today."

    msg.attach(MIMEText(body, 'plain'))
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(os.environ['EMAIL_USER'], os.environ['EMAIL_PASS'])
        server.send_message(msg)

if __name__ == "__main__":
    data = scrape_filings()
    send_email(data)
