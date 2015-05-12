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

if (module.parent) {
    module.exports = require(__dirname+'/lib/index.js');
}
else {
    var servers = [];
    var needMultitread = false;

    var readline = require('readline');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function addServer(callback){
        rl.question("AMI host [127.0.0.1]: ", function(host) {
            host = host || '127.0.0.1';
            rl.question("AMI port [5038]: ", function(port) {
                port = port || '5038';
                rl.question("AMI login [admin]: ", function(login) {
                    login = login || 'admin';
                    rl.question("AMI password [admin]: ", function(password) {
                        password = password || 'admin';
                        servers.push({host:host, port:port, login:login, password:password});
                        rl.question("Do you want another AMI?\n[y(Yes)/N(No)]: ", function(yesNo) {
                            yesNo = yesNo.toLowerCase();
                            if (yesNo !== 'y' && yesNo !== 'yes') return callback();
                            else return addServer(callback);
                        });
                    });
                });
            });
        });

    }
    function setMultitread(callback){
        rl.question("Do you want start workers in multi threads?\n[y(Yes)/N(No)]: ", function(yesNo) {
            yesNo = yesNo.toLowerCase();
            rl.close();
            if (yesNo == 'y' || yesNo == 'yes') return callback(true);
            else return callback(false);
        });
    }
    function startAmis(multi){
        if (multi) master = new (require(__dirname+'/lib/index.js').multi)();
        else master = new (require(__dirname+'/lib/index.js').mono)();
        var enabledEvents = ['connected', 'connectionRefused', 'incorrectServer', 'incorrectLogin', 'disconnect', 'ais.CallStart'];
        var silence = function(){};
        for(var i in servers){
            servers[i].enabledEvents = enabledEvents;
            servers[i].logger = {trace: silence, debug: silence, info:silence, warn:silence, error: silence, fatal: silence};
            master.openAmi(i, servers[i]);
            master.on('ami.connected', function(e){
                console.log(i, 'connected');
            });
            master.on('ami.ais.CallStart', function(e){
                console.log(e);
            });
            master.on('error', function(err){
                console.error('E:', err);
            });
        }
    }

    addServer(function(){
        setMultitread(function(multi){
            startAmis(multi);
        })
    });

    process.on('SIGTERM', function(){
        process.exit();
    });

    process.on('SIGINT', function(){
        process.exit();
    });
}