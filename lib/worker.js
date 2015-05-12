/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 (NumminorihSF) Konstantine Petryaev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var worker = new (require('events')).EventEmitter();
var AmiIo = require('ami-io-simple');
var Client = AmiIo.Client;
var Action = AmiIo.Action;
var amiio;

function setConfig (config){
    if (amiio) return;
    var silence = function(){};
    config.logger = {trace: silence, debug: silence, info:silence, warn:silence, error: silence, fatal: silence};
    amiio = new Client(config);
    for (var i=0; i < config.enabledEvents.length; i++){
        (function(i){
            amiio.on(config.enabledEvents[i], function(e){
                e = e || {};
                e.event = config.enabledEvents[i];
                process.stdout.write(JSON.stringify(e)+'\r\n\r\n');
            });
        })(i);
    }
    amiio.connect(true, 5000);
}


worker.on('ipc', function(ipc){
    fs.appendFile('/home/numminorihsf/test.log', '\n\nipc    '+JSON.stringify(ipc), function(err){console.error(err)});
    if (!amiio && ipc.params.action !== 'setConfig') return ipc.callback('Set config first');
    var action = ipc.params.action;
    var params = ipc.params.object;
    if (action === 'setConfig') {
        setConfig(params);
        return ipc.callback(null, 'success');
    }
    var act = new Action[params.actionName]();
    for(var i in params){
        if (params[i] === 'actionName') continue;
        act[i] = params[i];
    }
    amiio.send(act, ipc.callback);
});

module.exports = function(setWorker){
    setWorker(worker);
};