#!/bin/bash

# Define the download URLs for different architectures
linux_url="https://github.com/paritytech/substrate-contracts-node/releases/download/v0.27.0/substrate-contracts-node-linux.tar.gz"
mac_url="https://github.com/paritytech/substrate-contracts-node/releases/download/v0.27.0/substrate-contracts-node-mac-universal.tar.gz"

# Define the destination folder
destination_folder="./contracts_node"
temp_folder=$(mktemp -d)

# Create the destination folder if it doesn't exist
mkdir -p "$destination_folder"

# Check if the contract node already exists
if [ -f "$destination_folder/substrate-contracts-node" ]; then
  echo "Contract node already exists in the $destination_folder folder. Skipping download and extraction."
  exit 0
fi

# Determine the current operating system architecture
architecture=$(uname -sm)

# Select the appropriate download URL based on the architecture
if [[ $architecture == *"Linux"* ]]; then
  download_url=$linux_url
  folder_name="substrate-contracts-node-linux"
elif [[ $architecture == *"Darwin"* ]]; then
  download_url=$mac_url
  folder_name="substrate-contracts-node-mac"
else
  echo "Unsupported architecture: $architecture"
  exit 1
fi

# Download the contract node archive
wget "$download_url" -O contract_node.tar.gz

# Extract the contents of the archive to a tmp folder
tar -xzf contract_node.tar.gz -C "$temp_folder"

# Move the extracted files to the destination folder
mv "$temp_folder/artifacts/$folder_name/substrate-contracts-node" "$destination_folder/substrate-contracts-node"

# Set executable permissions for the contract node
chmod +x "$destination_folder/substrate-contracts-node"

# Clean up the downloaded archive and artifacts folder
rm contract_node.tar.gz
rm -r "$temp_folder"

echo "Contract node downloaded and installed successfully in the $destination_folder folder."