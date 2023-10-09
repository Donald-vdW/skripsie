task_esp_example(){
    mkdir -p $HOME/esp/test
    cd $HOME/esp/test
    cp -r $HOME/esp/esp-idf/examples/protocols/mqtt/tcp $HOME/esp/esp-idf/examples/get-started/* $HOME/esp/test/
    # sudo chmod a+rw /dev/ttyUSB1
}