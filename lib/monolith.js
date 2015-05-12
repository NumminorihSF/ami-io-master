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

var AmiIo = require('ami-io-simple');
var Action = AmiIo.Action;
var Client = AmiIo.Client;
function AmiIoMonolith(options){
    options = options || {};
    AmiIoMonolith.super_.call(this, options);
    return this;
}

(function(){
    require('util').inherits(AmiIoMonolith, (require(__dirname+'/prototype.js')));
})();

AmiIoMonolith.prototype.closeAmi = function(id){
    this.amis[id].removeListener('rawEnabledEvent');
    this.amis[id].disconnect();
    delete this.amis[id];
};

AmiIoMonolith.prototype.openAmi = function(id, config, callback){
    config.logger = config.logger || this.logger;
    this.amis[id] = new Client(config);
    var self = this;
    this.amis[id].on('rawEnabledEvent', function(eventObject){
        eventObject.amiId = id;
        self.emit('ami.'+eventObject.event, eventObject);
        self.emit('ami', eventObject);
    });
    for(var i=0; i < config.enabledEvents.length; i++){
        (function(i){
            this.amis[id].on(config.enabledEvents[i], function(e){
                if (!e) e = {};
                e.event = config.enabledEvents[i];
                self.amis[id].emit('rawEnabledEvent', e);
            });
        }.bind(this))(i);
    }
    this.amis[id].on('error', function(err){self.emit('error', err)});
    this.amis[id].connect(true, 5000);
    if (callback) return callback();
};

AmiIoMonolith.prototype.send = function(id, actionObject, callback){
    if (!this.amis[id]) return callback(Error('no such id: '+id));
    var act = new Action[actionObject.actionName]();
    for(var i in actionObject){
        if (actionObject[i] === 'actionName') continue;
        act[i] = actionObject[i];
    }
    this.amis[id].send(act, callback);
};

module.exports = AmiIoMonolith;