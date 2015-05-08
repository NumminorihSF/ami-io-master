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

var defaultLogger = {
    trace: function(){console.log('TRACE\t'+ Array.prototype.join.call(arguments, ' '));},
    debug: function(){console.log('DEBUG\t'+ Array.prototype.join.call(arguments, ' '));},
    info: function(){console.log('INFO\t'+ Array.prototype.join.call(arguments, ' '));},
    warn: function(){console.error('WARN\t'+ Array.prototype.join.call(arguments, ' '));},
    error: function(){console.error('ERROR\t'+ Array.prototype.join.call(arguments, ' '));},
    fatal: function(){console.error('FATAL\t'+ Array.prototype.join.call(arguments, ' '));}
};

function AmiIoMaster (options, getAmiOptionFunction){
    AmiIoMaster.super_.call(this);
    options = options || {};
    this.logger = options.logger || defaultLogger;
    this.getAmiOptionFunction = getAmiOptionFunction;
    this.amis = {};
    return this;
}

(function(){
    require('util').inherits(AmiIoMaster, (require('events')).EventEmitter);
})();

AmiIoMaster.prototype.setAmiIoUsing = function(idsArray, callback){
    var stringIds = [];
    for(var i=0; i<idsArray.length; i++){
        stringIds.push(String(idsArray[i]));
    }
    for(var k in this.amis){
        if (stringIds.indexOf(k) === -1) {
            this.closeAmi(k);
        }
    }
    var run = {success: [], errors: []};
    var runCounter = 0;
    for(i=0; i<stringIds.length; i++){
        if (!(stringIds[i] in this.amis)) {
            runCounter++;
            (function(i){
                setImmediate(function(){
                    this.getAmiOptionFunction(stringIds, function(err, config){
                        if (err) run.errors.push({id: stringIds[i], error: err});
                        else {
                            run.success.push({id: stringIds});
                            this.openAmi(stringIds[i], config);
                        }
                        if ((run.success.length+run.errors.length) === runCounter) return callback(run.errors.length?run.errors:null, run.success);
                    })
                }.bind(this));
            }.bind(this))(i);
        }
    }
    if (runCounter === 0) return callback(null, run);
    return callback();
};


module.exports = AmiIoMaster;