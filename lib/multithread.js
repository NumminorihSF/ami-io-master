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


function AmiIoMultitread(options){
    options = options || {};
    AmiIoMultitread.super_.call(this, options);
    this.threadManager =  new (require('child-watcher').Master)({logger: this.logger});
    return this;
}

(function(){
    require('util').inherits(AmiIoMultitread, (require(__dirname+'/prototype.js')));
})();

AmiIoMultitread.prototype.closeAmi = function(id){
    this.amis[id].removeListener('rawEnabledEvent');
    this.threadManager.killChild(id);
    delete this.amis[id];
};

AmiIoMultitread.prototype.openAmi = function(id, config, callback){
    config.filePath = __dirname+'/worker.js';
    this.amis[id] = this.threadManager.newChild(id, config);
    this.amis[id].ipc({action: 'setConfig', object: config}, function(err, data){
        var self = this;
        this.amis[id].on('rawEnabledEvent', function(eventObject){
            eventObject.amiId = id;
            self.emit('ami.'+eventObject.event, eventObject);
            self.emit('ami.', eventObject);
        });

        this.amis[id].on('json', function(e){
            if (e.event) self.amis[id].emit('rawEnabledEvent', e);
        });

        this.threadManager.on(id, 'error', function(err){
            this.emit('error', err);
        }.bind(this));
        if (callback) return callback(err);
    }.bind(this));
};


AmiIoMultitread.prototype.send = function(id, actionObject, callback){
    if (!this.amis[id]) return callback(Error('no such id: '+id));
    this.amis[id].ipc({actionObject: actionObject}, callback);
};


module.exports = AmiIoMultitread;