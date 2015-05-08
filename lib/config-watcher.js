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

function ConfigWatcher (options, getting){
    if (typeof options == 'function'){
        getting = options;
        options = {};
    }
    else options = options || {};
    this.getConfigFunction = getting;
    this.intervals = {};
    this.timeouts = {};
    this.expireTimeout = options.expireTimeout || 60000;
    this.result = {};
    return this;
}

ConfigWatcher.prototype.getConfig = function(params, callback){
    var identifier = JSON.stringify(params);
    if (identifier in this.result) return callback(null, this.result[identifier]);
    this.getConfigFunction(params, function(err, data){
        if (err) return callback(err);
        setTimeout(function(){
            delete this.timeouts[identifier];
            delete this.result[identifier];
        }.bind(this), this.expireTimeout);
        this.result[identifier] = data;
        return callback(data);
    }.bind(this));
};

ConfigWatcher.prototype.getConfigAuto = function(params, interval, callback){
    var identifier = JSON.stringify(params);
    this.intervals[identifier] = setInterval(function(){
        this.getConfigFunction(params, function(err, data){
            if (err){
                if (this.result[identifier]) return callback(null, this.result[identifier]);
                return callback(err);
            }
            return callback(null, data);
        }.bind(this));
    }.bind(this), interval);
    this.getConfig(params, function(err, data){
        clearTimeout(this.timeouts[identifier]);
        delete this.timeouts[identifier];
        return callback(err, data);
    }.bind(this));
    return this.intervals[identifier];
};

module.exports = ConfigWatcher;