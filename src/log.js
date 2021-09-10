const log = require('@vladmandic/pilogger');

for (const key of Object.keys(log)) exports[key] = log[key];
