/*global _, angular */

angular.module('cyViewerApp')
    .controller('EmbeddedCtr', ['$rootScope', '$scope', '$http', '$location', '$routeParams', '$window', 'Network', 'VisualStyles',
        'ndexService', 'networkConverterService',
        function($rootScope, $scope, $http, $location, $routeParams, $window, Network, VisualStyles, ndexService, networkConverterService) {

            'use strict';

            var FILE_LIST_NAME = 'filelist.json';

            // Name of network tag in the DOM
            var NETWORK_SECTION_ID = '#embedded';

            // Default Visual Style name
            var DEFAULT_VISUAL_STYLE_NAME = 'NDEx_BEL';

            var visualStyleFile;
            var networkData;

            $scope.LAYOUTS = [
                'preset', 'random', 'grid', 'circle', 'concentric', 'breadthfirst', 'cose'
            ];


            // Application global objects
            $scope.ndexId = 'f000467c-b3c0-11e4-ae6e-000c29cb28fb';
            $rootScope.ndexId = 'f000467c-b3c0-11e4-ae6e-000c29cb28fb';
            $scope.networks = {};
            $scope.ndexNetworks = {};

            $scope.currentVS = null;
            $scope.visualStyles = [];
            $scope.visualStyleNames = [];
            $scope.networkNames = [];
            // $scope.currentNetworkData = null;

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
                    name: 'preset'
                },

                ready: function() {
                    $scope.cy = this;
                    $scope.cy.load(networkData.elements);
                    //console.log(JSON.stringify($scope.cy.json()));

                    VisualStyles.query({
                        filename: visualStyleFile
                    }, function(vs) {
                        init(vs);
                        setEventListeners();
                        $scope.currentVS = DEFAULT_VISUAL_STYLE_NAME;
                        $scope.currentLayout = 'preset';
                        $scope.cy.style().fromJson($scope.visualStyles[DEFAULT_VISUAL_STYLE_NAME].style).update();
                        angular.element('.loading').remove();
                    });
                }
            };


            function init(vs) {
                $scope.nodes = networkData.elements.nodes;
                $scope.edges = networkData.elements.edges;
                initVisualStyleCombobox(vs);

                // Set network name
                var networkName = networkData.data.name;
                if (!$scope.networks[networkName]) {
                    $scope.networks[networkName] = networkData;
                    $scope.networkNames.push(networkName);
                    $scope.currentNetwork = networkData.data.name;
                }
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
                    delete $scope.selectedNodes[id];
                    updateFlag = true;
                });
                $scope.cy.on('unselect', 'edge', function(event) {
                    var id = event.cyTarget.id();
                    delete $scope.selectedEdges[id];
                    updateFlag = true;
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

            ///////////////////// Start the loading process ////////////////



            $http.get(FILE_LIST_NAME).success(function(fileList) {
                visualStyleFile = fileList.style;

                var defaultNetworkName = null;

                _.each(_.keys(fileList), function(key) {
                    if (key !== 'style') {
                        if (defaultNetworkName === null) {
                            defaultNetworkName = key;
                        }
                        $scope.networks[key] = fileList[key];
                        $scope.networkNames.push(key);
                    }
                });

                var MAX_EDGE_COUNT = 100000;
                if ($rootScope.ndexNetwork === undefined || $rootScope.ndexNetwork === null) {
                    ndexService.getNetworkByEdges('f000467c-b3c0-11e4-ae6e-000c29cb28fb', 0, MAX_EDGE_COUNT)
                        .success(function(ndexNetwork) {
                            console.log(ndexNetwork);
                            $rootScope.originalNetwork = ndexNetwork;
                            networkData = networkConverterService.toCytoscapeJs(ndexNetwork);
                            angular.element(NETWORK_SECTION_ID).cytoscape(options);
                            $scope.currentNetworkData = networkData;
                            $scope.currentNetwork = defaultNetworkName;

                            $rootScope.ndexNetwork = networkData;
                        })
                        .error(function(error) {
                            console.log(error);
                        });

                } else {
                    console.log('Network exists: ' + $rootScope.ndexNetwork.data['name']);
                    networkData = $rootScope.ndexNetwork;
                    $scope.currentNetworkData = networkData;
                    $scope.currentNetwork = defaultNetworkName;
                    angular.element(NETWORK_SECTION_ID).cytoscape(options);
                }
            });
        }
    ]);
