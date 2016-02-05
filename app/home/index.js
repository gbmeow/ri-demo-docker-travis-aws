var HomeCtrl = require('./homectrl');
module.exports = function(ngModule) {
    ngModule.controller('HomeCtrl', HomeCtrl);
    if (ON_TEST) {
        require('./homectrltest')(ngModule); 
    }
    
}