#!/bin/bash

cd $HOME/repos
git clone https://github.com/vastverse/VAST.js.git
cd $HOME/repos/VAST.js
npm install
npm install socket.io socket.io-client jquery axios