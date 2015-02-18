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
				data: nodeData,
        position: getNodePosition(node.presentationProperties)
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

  this.updateNdexNetwork = function(ndexNetwork, cyjsNetwork) {
    var nodes = cyjsNetwork.elements.nodes;
    var ndexNodes = ndexNetwork.nodes;

    _.each(nodes, function(node) {
      var id = node.data.id;
      var position = node.position;

      var ndexNode = ndexNodes[id];
      ndexNode.presentationProperties = [];
      ndexNode.presentationProperties.push({
        name: 'x',
        type: "SimplePropertyValuePair",
        value: position.x.toString()
      });

      ndexNode.presentationProperties.push({
        name: 'y',
        type: "SimplePropertyValuePair",
        value: position.y.toString()
      });

    });
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
			name: label,
      functionType: getFunctionType(ndexNode, ndexNetwork),
      terms: getTerm(ndexNode, ndexNetwork)
		};

		return data;
	};

  var getTerm = function(ndexNode, ndexNetwork) {
    var represents = ndexNode.represents;
    var functionTerm = ndexNetwork.functionTerms[represents];
    var parameterIds = functionTerm.parameterIds;


    return getParams(parameterIds, ndexNetwork, []);

  };

  var getParams = function(paramList, ndexNetwork, results) {
    _.each(paramList, function(id) {
      var param = ndexNetwork.baseTerms[id];
      if(param === undefined) {
        param = ndexNetwork.functionTerms[id];
        return getParams(param.parameterIds, ndexNetwork, results);
      }

      if(param !== undefined) {
        var nameSpace = ndexNetwork.namespaces[param.namespaceId];
        results.push({
          namespace: nameSpace.prefix,
          name: param.name
        });
      }
    });
    return results;

  }

  var getNodePosition = function(presentationProperties) {
    var position = {};
    var len = presentationProperties.length;
    for(var i = 0; i<len; i++) {
      var prop = presentationProperties[i];
      if(prop.name === 'x' || prop.name === 'y') {
        position[prop.name] = parseFloat(prop.value);
      }
    }

    return position;
  };


  // This is BEL specific.
  var getFunctionType = function(node, ndexNetwork) {

    var represents = node.represents;
    var functionTerm = ndexNetwork.functionTerms[represents];
    var baseTerm = ndexNetwork.baseTerms[functionTerm.functionTermId];

    return baseTerm.name;

  };

  var getFunctionTermName = function(functionTerm) {
    var functionTermId = functionTerm.functionTermId;

    var parameters = functionTerm.parameterIds;
    var parameterTerms = [];
    _.each(parameters, function(parameter) {
      console.log(parameter);
      var term = ndexNetwork.baseTerms[parameter];
      if(term === undefined) {
        term = ndexNetwork.functionTerms[parameter];
      }
      parameterTerms.push(term);
    });

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
	};

	var findTerm = function(termId, ndexNetwork) {
		var idString = termId.toString();
		var term = ndexNetwork.baseTerms[idString];
		return ndexHelper.getTermLabel(term, ndexNetwork);
	};

}]);
