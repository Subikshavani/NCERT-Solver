import zipfile
import os

def extract_all_zips(directory):
    for item in os.listdir(directory):
        if item.endswith(".zip"):
            file_name = os.path.join(directory, item)
            dest_dir = os.path.join(directory, item.replace(".zip", ""))
            
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
            
            print(f"Extracting {file_name} to {dest_dir}...")
            with zipfile.ZipFile(file_name, 'r') as zip_ref:
                zip_ref.extractall(dest_dir)
            print(f"Finished extracting {item}")

if __name__ == "__main__":
    zip_dir = "data/raw/10"
    if os.path.exists(zip_dir):
        extract_all_zips(zip_dir)
    else:
        print(f"Directory {zip_dir} not found.")
