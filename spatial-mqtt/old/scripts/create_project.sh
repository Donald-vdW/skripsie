cd $HOME/spatial-mqtt/mqtt-on-vast
echo '{
    "name": "mqtt-on-vast",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "dependencies": {
        "mqtt": "^5.0.5",
        "aedes": "file:'"$HOME"'/repos/aedes",
        "vast.js": "file:'"$HOME"'/repos/VAST.js",
        "websocket-stream": "^5.5.2"
    }
}' > package.json