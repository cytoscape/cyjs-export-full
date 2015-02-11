// Sample project for visualizing JSON files.
//
//   by Keiichiro Ono
//
'use strict';

angular.module('cyViewerApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ngAnimate',
    'ui.bootstrap',
    'angular-underscore',
    'colorpicker.module',
    'angularSpinner',
    
    // For NDEx access
    'ndexServiceApp'
])
    .config(function($routeProvider) {
        // Routing
        $routeProvider
            .when('/', {
                templateUrl: 'views/paper.html',
                controller: 'EmbeddedCtr'
            })
            .when('/full', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                 redirectTo: '/'
            });
    });