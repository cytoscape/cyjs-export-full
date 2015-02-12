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

			var nodeData = getNodeData(index, node, ndexNetwork);
			var cyNode = {
				data: nodeData
			};
			elements.nodes.push(cyNode);

		});

		$.each(ndexNetwork.edges, function(index, edge) {
			var edgeData = getEdgeData(edge, ndexNetwork);

			var cyEdge = {
				data: edgeData
			};
			elements.edges.push(cyEdge);
		});

		var networkData = getNetworkData(ndexNetwork);

		return cyJsNetwork = {
			data: networkData,
			elements: elements
		};
	};



	var getNetworkData = function(ndexNetwork) {
		var data = {};
		data.name = ndexNetwork.name;
		data.description = ndexNetwork.description;
		data.id = ndexNetwork.externalId;

		return data;
	};


	var getNodeData = function(index, ndexNode, ndexNetwork) {
		var label = ndexHelper.getNodeLabel(ndexNode, ndexNetwork);
		var data = {
			id: index.toString(),
			name: label
		}
		return data;
	};

	var getEdgeData = function(ndexEdge, ndexNetwork) {
		var data = {};
		data.source = ndexEdge.subjectId.toString();
		data.target = ndexEdge.objectId.toString();
		data.predicateId = findTerm(ndexEdge.predicateId, ndexNetwork);
		data.citations = [];

		var len = ndexEdge.citationIds.length;
		for(var idx = 0; idx<len; idx++) {
			var citationObj = ndexNetwork.citations[ndexEdge.citationIds[idx].toString()];
			data.citations.push(citationObj);
		}
		
		data.supports = [];
		len = ndexEdge.supportIds.length;
		for(var idx = 0; idx<len; idx++) {
			var supportObj = ndexNetwork.supports[ndexEdge.supportIds[idx].toString()];
			data.supports.push(supportObj);
		}

		data.interaction = data.supports[0].text;

		return data;
	}

	var findTerm = function(termId, ndexNetwork) {
		var idString = termId.toString();
		var term = ndexNetwork.baseTerms[idString];
		return ndexHelper.getTermLabel(term, ndexNetwork);
	};

}]);