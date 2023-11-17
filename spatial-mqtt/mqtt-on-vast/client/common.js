// define log if not defined
global.VISUALISE_DEBUG_LOGS = false;
// global.BROKER = 'localhost'
// global.BROKER = '127.0.1.1'
// global.BROKER = '192.168.1.53' //pi53
// global.BROKER = '192.168.1.216'
global.BROKER = '192.168.1.197'
global.PORT = '1884'
// global.PORT = '1883'
global.PUBLISH = 0
global.SUBSCRIBE = 1

if (typeof global.LOG === 'undefined') {
	var logger  = require('vast.js/lib/common/logger');
	global.LOG  = new logger();
}

global.Client_Event = {
    CLIENT_JOIN :       0,
    CLIENT_LEAVE :      1,
    CLIENT_CONNECT:     2,
    CLIENT_DISCONNECT : 3,
    CLIENT_MIGRATE:     4,
    CLIENT_MOVE :       5,
    SUB_NEW :           6,
    SUB_UPDATE :        7,
    SUB_DELETE :        8,
    PUB :               9,
    RECEIVE_PUB:        10,
    START_TEST:         11,
    END_TEST:           12,
    NON_SPATIAL_EVENT:  13,
}

global.Client_Event_Str = [
    `CLIENT_JOIN`,
    `CLIENT_LEAVE`,
    `CLIENT_CONNECT`,
    `CLIENT_DISCONNECT`,
    `CLIENT_MIGRATE`,
    `CLIENT_MOVE`,
    `SUB_NEW`,
    `SUB_UPDATE`,
    `SUB_DELETE`,
    `PUB`,
    `RECEIVE_PUB`,
  ]

global.LogEventType = {
    logLayer :          0,
    eventsLayer :       1, 
    logFile :           2,
    eventsFile:         3,
    logDirectory:       4,
    eventsDirectory:    5,
    logRecordLevel:     6,
    eventRecordLevel:   7,
    logDisplayLevel:    8,
    eventDisplayLevel:  9
};

global.LogEventVar = [
    'Client_logs',
    'Client_events',
    'Client_logs',
    'Client_events',
    'logs_and_events',
    'logs_and_events',
    5,  // Client logRecordLevel
    5,  // Client eventRecordLevel
    0,  // Client logDisplayLevel
    0,  // Client eventDisplayLevel
];

global.log = LOG.newLayer(
    LogEventVar[LogEventType.logLayer],
    LogEventVar[LogEventType.logFile], 
    LogEventVar[LogEventType.logDirectory], 
    LogEventVar[LogEventType.logDisplayLevel], 
    LogEventVar[LogEventType.logRecordLevel]
);

global.events = LOG.newLayer(
    LogEventVar[LogEventType.eventsLayer], 
    LogEventVar[LogEventType.eventsFile], 
    LogEventVar[LogEventType.eventsDirectory], 
    LogEventVar[LogEventType.eventDisplayLevel], 
    LogEventVar[LogEventType.eventRecordLevel]
);
