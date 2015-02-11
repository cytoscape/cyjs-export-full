/**
 * Created by kono on 2014/11/08.
 */
angular.module('cyViewerApp')
    .controller('NdexModalCtrl', ['ndexService', '$scope', '$modal', '$log',
        function(ndexService, $scope, $modal, $log) {

            $scope.open = function(size) {

                var modalInstance = $modal.open({
                    templateUrl: 'myModalContent.html',
                    controller: 'NdexModalInstanceCtrl',
                    size: size,
                    resolve: {
                        items: function() {
                            return $scope.networkSearchResults;
                        }
                    }
                });

                modalInstance.result.then(function(network) {

                    var networkName = 'NDEx: ' + network.cyjs.data.name;

                    console.log('Closing...');
                    console.log(network);
                    console.log(networkName);

                    $scope.ndexNetworks[networkName] = network.original;
                    $scope.networks[networkName] = network.cyjs;
                    $scope.networkNames.push(networkName);
                    $scope.currentNetwork = networkName;
                    $scope.$emit('switchNetwork', networkName);

                }, function() {

                    $log.info('Modal dismissed at: ' + new Date());
                });
            };
        }
    ]);

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.
angular.module('cyViewerApp')
    .controller('NdexModalInstanceCtrl', ['ndexService', 'ndexHelper', '$rootScope', '$scope', '$modalInstance',
        function(ndexService, ndexHelper, $rootScope, $scope, $modalInstance) {

            $scope.search = function() {
                var searchString = $scope.query;

                console.log('Search Query = ' + searchString);

                $scope.networkSearchResults = [];
                var errors = [];
                var skip = 0;
                var skipSize = 30;
                var request = null;
                var accountName = null;
                var permission = null;
                var includeGroups = null;

                (request = ndexService.findNetworks(
                    searchString,
                    accountName,
                    permission,
                    includeGroups,
                    skip,
                    skipSize))
                .success(
                        function(networks) {
                            if (networks.length == 0)
                                errors.push('No results found that match your criteria')

                            console.log('got results');
                            console.log(networks);
                            // Save the results
                            $scope.networkSearchResults = networks;
                        })
                    .error(
                        function(error, data) {
                            console.log('Error!');
                            // Save the error.
                            if (error) {
                                $scope.networkSearchResults = [];
                                errors.push(error);
                            }
                        })

                // $modalInstance.close($scope.selected.item);
            };

            $scope.setAndDisplayCurrentNetwork = function(networkID) {
                var MAX_EDGE_COUNT = 100000;
                ndexService.getNetworkByEdges(networkID, 0, MAX_EDGE_COUNT)
                    .success(function(network) {
                        console.log(network);
                        var networkName = network.externalId;
                        var cyjsNetwork = toCytoscapeJs(network);
                        console.log(cyjsNetwork);

                        // $rootScope.networks[networkName] = cyjsNetwork;
                        // $rootScope.networkNames.push(networkName);
                        // $rootScope.currentNetwork = networkName;
                        var networkPair = {
                            original: network,
                            cyjs: cyjsNetwork
                        }
                        $scope.ndexNetwork = networkPair;

                        $modalInstance.close($scope.ndexNetwork);
                    })
                    .error(function(error) {
                        console.log(error);
                    });

            };

            function toCytoscapeJs(network) {
                // build the new elements structure
                var elements = {
                    nodes: [],
                    edges: []
                };

                $.each(network.nodes, function(index, node) {

                    var label = ndexHelper.getNodeLabel(node, network);
                    var cyNode = {
                        data: {
                            id: index.toString(),
                            name: label
                        }
                    };
                    elements.nodes.push(cyNode);

                });

                $.each(network.edges, function(index, edge) {
                    var cyEdge = {
                        data: {
                            source: edge.subjectId.toString(),
                            target: edge.objectId.toString()
                        }
                    };
                    elements.edges.push(cyEdge);
                });

                var cyJsNetwork = {
                    data: {
                        id: network.externalId,
                        name: network.name
                    },
                    elements: elements
                };

                return cyJsNetwork;
            };


            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ]);