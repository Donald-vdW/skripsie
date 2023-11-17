#!/bin/bash

# Create esp directory and install ESP-IDF
cd $HOME/esp
git clone --recursive http://github.com/espressif/esp-idf.git
cd $HOME/esp/esp-idf
/usr/bin/python3 $HOME/esp/esp-idf/tools/idf_tools.py install
$HOME/esp/esp-idf/tools/idf_tools.py install-python-env
./install.sh esp32,esp32c3,esp32s3