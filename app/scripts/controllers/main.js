/*global _, angular */

angular.module('cyViewerApp')
    .controller('MainCtrl', ['$rootScope', '$scope', '$http', '$location', '$routeParams', '$window', 'Network', 'VisualStyles', 'ndexService',
        function($rootScope, $scope, $http, $location, $routeParams, $window, Network, VisualStyles, ndexService) {

            'use strict';

            var FILE_LIST_NAME = 'filelist.json';

            // Name of network tag in the DOM
            var NETWORK_SECTION_ID = '#network';

            // Default Visual Style name
            var DEFAULT_VISUAL_STYLE_NAME = 'NDEx_BEL';
            var DEFAULT_LAYOUT_NAME = 'preset';

            var visualStyleFile;
            var networkData;

            $scope.LAYOUTS = [
                'preset', 'random', 'grid', 'circle', 'concentric', 'breadthfirst', 'cose'
            ];


            // Application global objects
            $scope.networks = {};
            $scope.ndexNetworks = {};

            $scope.currentVS = null;
            $scope.visualStyles = [];
            $scope.visualStyleNames = [];
            $scope.networkNames = [];
            $scope.currentNetworkData = null;

            // Query for NDEx
            $scope.searchQuery = null;

            // Show / Hide Table browser
            $scope.browserState = {
                show: false
            };

            // Show / Hide style selector UI
            $scope.overlayState = {
                show: true
            };

            // Show / Hide toolbar
            $scope.toolbarState = {
                show: true
            };

            // Show / Hide style selector UI
            $scope.detailsState = {
                show: false
            };

            // Background color
            $scope.bg = {
                color: '#FAFAFA'
            };

            $scope.columnNames = [];
            $scope.edgeColumnNames = [];
            $scope.networkColumnNames = [];

            // Basic settings for the Cytoscape window
            var options = {
                showOverlay: false,
                minZoom: 0.01,
                maxZoom: 200,

                layout: {
                    name: DEFAULT_LAYOUT_NAME
                },

                ready: function() {
                    $scope.cy = this;
                    $scope.cy.load(networkData.elements);

                    VisualStyles.query({
                        filename: visualStyleFile
                    }, function(vs) {
                        init(vs);
                        setEventListeners();
                        $scope.currentVS = DEFAULT_VISUAL_STYLE_NAME;
                        $scope.currentLayout = DEFAULT_LAYOUT_NAME;
                        $scope.cy.style().fromJson($scope.visualStyles[DEFAULT_VISUAL_STYLE_NAME].style).update();
                        angular.element('.loading').remove();
                    });
                }
            };


            function init(vs) {
                $scope.nodes = networkData.elements.nodes;
                $scope.edges = networkData.elements.edges;
                initVisualStyleCombobox(vs);

                // Get column names
                setColumnNames();

                if ($routeParams.bgcolor) {
                    $scope.bg.color = $routeParams.bgcolor;
                }
            }

            function setColumnNames() {
                $scope.columnNames = [];
                $scope.edgeColumnNames = [];
                $scope.networkColumnNames = [];

                var oneNode = $scope.nodes[0];
                for (var colName in oneNode.data) {
                    $scope.columnNames.push(colName);
                }
                var oneEdge = $scope.edges[0];
                for (var edgeColName in oneEdge.data) {
                    $scope.edgeColumnNames.push(edgeColName);
                }
                for (var netColName in networkData.data) {
                    $scope.networkColumnNames.push(netColName);
                }
            }

            function reset() {
                $scope.selectedNodes = {};
                $scope.selectedEdges = {};
            }

            /*
             Event listener setup for Cytoscape.js
             */
            function setEventListeners() {
                $scope.selectedNodes = {};
                $scope.selectedEdges = {};

                var updateFlag = false;

                // Node selection
                $scope.cy.on('select', 'node', function(event) {
                    var id = event.cyTarget.id();
                    $scope.selectedNodes[id] = event.cyTarget;
                    updateFlag = true;
                });

                $scope.cy.on('select', 'edge', function(event) {
                    var id = event.cyTarget.id();
                    $scope.selectedEdges[id] = event.cyTarget;
                    updateFlag = true;
                });

                // Reset selection
                $scope.cy.on('unselect', 'node', function(event) {
                    var id = event.cyTarget.id();
                    $scope.detailsState.show = false;
                    delete $scope.selectedNodes[id];
                    updateFlag = true;
                });
                $scope.cy.on('unselect', 'edge', function(event) {
                    var id = event.cyTarget.id();
                    $scope.detailsState.show = false;
                    delete $scope.selectedEdges[id];
                    updateFlag = true;
                });

                // For popup
                $scope.cy.on('click', 'node', function(event) {
                    var node = event.cyTarget;
                    console.log(node.data());
                    $scope.name = node.data().name;
                    $scope.detailsState.show = true;
                    $scope.$apply();
                });

                $scope.cy.on('click', 'edge', function(event) {
                    var edge = event.cyTarget;
                    console.log(edge.data());
                    $scope.name = edge.data().interaction;
                    $scope.detailsState.show = true;
                    $scope.$apply();

                });

                setInterval(function() {
                    if (updateFlag && $scope.browserState.show) {
                        $scope.$apply();
                        updateFlag = false;
                    }
                }, 300);

            }

            function initVisualStyleCombobox(vs) {
                _.each(vs, function(visualStyle) {
                    $scope.visualStyles[visualStyle.title] = visualStyle;
                    $scope.visualStyleNames.push(visualStyle.title);
                });

                $scope.currentVS = DEFAULT_VISUAL_STYLE_NAME;
            }


            $scope.toggleTableBrowser = function() {
                $scope.browserState.show = !$scope.browserState.show;
            };

            $scope.toggleOverlay = function() {
                $scope.overlayState.show = !$scope.overlayState.show;
            };

            $scope.toggleToolbar = function() {
                $scope.toolbarState.show = !$scope.toolbarState.show;
            };

            $scope.toggleDetails = function() {
                $scope.detailsState.show = false;
            };

            $scope.fit = function() {
                $scope.cy.fit();
            };


            // Apply Visual Style
            $scope.switchVS = function() {
                var vsName = $scope.currentVS.trim();
                var vs = $scope.visualStyles[vsName].style;
                // Apply Visual Style
                $scope.cy.style().fromJson(vs).update();
            };


            $scope.switchNetwork = function() {
                var networkFile = $scope.networks[$scope.currentNetwork];
                console.log(typeof networkFile);
                console.log(networkFile);

                if (typeof networkFile === 'object') {
                    loadNetwork(networkFile, true);
                    console.log($scope.ndexNetworks[$scope.currentNetwork]);
                    return;
                }

                networkData = Network.get({
                        filename: networkFile
                    },
                    function(network) {
                        loadNetwork(network, false);
                    });

                function loadNetwork(network, applyLayout) {
                    $scope.cy.load(network.elements);
                    if (applyLayout) {
                        $scope.cy.layout({
                            name: 'grid'
                        });
                    }
                    console.log($scope.cy.json());

                    $scope.currentNetworkData = networkData;
                    reset();
                    $scope.nodes = network.elements.nodes;
                    $scope.edges = network.elements.edges;
                    setColumnNames();
                }
            };

            $scope.switchLayout = function() {
                var layoutOptions = {
                    name: $scope.currentLayout
                };
                $scope.cy.layout(layoutOptions);
            };



            // Search network in ndex
            $scope.$on('switchNetwork', function(event, data) {
                console.log('Got Switch');
                console.log(data); // 'Data to send'
                $scope.switchNetwork();
            });



            // Load the network and style data
            $http.get(FILE_LIST_NAME).success(function(fileList) {
                visualStyleFile = fileList.style;

                var MAX_EDGE_COUNT = 100000;
                if ($rootScope.ndexNetwork === undefined || $rootScope.ndexNetwork === null) {
                    ndexService.getNetworkByEdges('f000467c-b3c0-11e4-ae6e-000c29cb28fb', 0, MAX_EDGE_COUNT)
                        .success(function(ndexNetwork) {
                            console.log(ndexNetwork);
                            $rootScope.originalNetwork = ndexNetwork;
                            $scope.originalNetwork = ndexNetwork;
                            networkData = networkConverterService.toCytoscapeJs(ndexNetwork);
                            console.log(networkData);
                            angular.element(NETWORK_SECTION_ID).cytoscape(options);
                            $scope.currentNetworkData = networkData;
                            $scope.currentNetwork = defaultNetworkName;

                            $rootScope.ndexNetwork = networkData;
                            $rootScope.currentNetworkData = networkData;
                        })
                        .error(function(error) {
                            console.log(error);
                        });

                } else {
                    console.log('Network exists: ' + $rootScope.ndexNetwork.data['name']);
                    networkData = $rootScope.ndexNetwork;
                    $scope.currentNetworkData = networkData;
                    $scope.currentNetwork = networkData.data.name;
                    $rootScope.currentNetworkData = networkData;
                    angular.element(NETWORK_SECTION_ID).cytoscape(options);
                }

            });
        }
    ]);
