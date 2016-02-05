var angular = require('angular');
require('angular-material');

if (ON_TEST) {
    require('angular-mocks/angular-mocks');
}

var home = require('./home');


var app = angular.module('app', ['ngMaterial']);
home(app);
