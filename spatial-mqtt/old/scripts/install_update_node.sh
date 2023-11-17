#!/bin/bash

sudo apt-get install -y nodejs npm
sudo npm install -g n
echo "Updating Node to version 20.6.1..."
sudo n 20.6.1
hash -r