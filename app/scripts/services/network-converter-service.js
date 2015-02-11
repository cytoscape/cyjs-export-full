var viewerApp = angular.module('cyViewerApp');

// Definition of NDEx --> Cytoscape.js converter service
viewerApp.service('networkConverterService', ['ndexHelper', function(ndexHelper) {

	this.name = 'converter service';

	this.toCytoscapeJs = function(ndexNetwork) {
		// build the new elements structure
		var elements = {
			nodes: [],
			edges: []
		};

		$.each(ndexNetwork.nodes, function(index, node) {

			var label = ndexHelper.getNodeLabel(node, ndexNetwork);
			var cyNode = {
				data: {
					id: index.toString(),
					name: label
				}
			};
			elements.nodes.push(cyNode);

		});

		$.each(ndexNetwork.edges, function(index, edge) {
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
				id: ndexNetwork.externalId,
				name: ndexNetwork.name
			},
			elements: elements
		};

		return cyJsNetwork;
	};
}]);