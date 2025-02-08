import subprocess
import os

# Define source and destination paths
source_path = r"C:\Users\USER\Desktop\logo.png"
destination_folder = r"C:\Users\USER\Desktop\resume edits"

# Ensure the destination folder exists
os.makedirs(destination_folder, exist_ok=True)

# Construct the Windows copy command
command = f'copy "{source_path}" "{destination_folder}"'

try:
    subprocess.run(command, shell=True, check=True)
    print(f"File copied successfully to {destination_folder}")
except subprocess.CalledProcessError as e:
    print(f"Error copying file: {e}")
