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
    label = belAbbreviate(label);
    console.log("node label = " + label);
		var data = {
			id: index.toString(),
			name: label,
      functionType: getFunctionType(ndexNode, ndexNetwork),
      terms: getTerm(ndexNode, ndexNetwork)
		};

		return data;
	};

  var belAbbreviate = function(input){
    label = input;
    label = label.replace(/bel:/ig, "");
    label = label.replace(/PROTEIN_ABUNDANCE\(/ig, "p(");
    label = label.replace(/RNA_ABUNDANCE\(/ig, "r(");
    label = label.replace(/COMPLEX_ABUNDANCE\(/ig, "complex(");
    label = label.replace(/ABUNDANCE\(/ig, "a(");
    label = label.replace(/KINASE_ACTIVITY\(/ig, "kin(");
    label = label.replace(/CATALYTIC_ACTIVITY\(/ig, "cat(");
    label = label.replace(/GTP_BOUND_ACTIVITY\(/ig, "gtp(");
    label = label.replace(/PEPTIDASE_ACTIVITY\(/ig, "pep(");
    label = label.replace(/BIOLOGICAL_PROCESS\(/ig, "bp(");
    label = label.replace(/MOLECULAR_ACTIVITY\(/ig, "act(");
    label = label.replace(/TRANSCRIPTIONAL_ACTIVITY\(/ig, "trans(");
    label = label.replace(/PROTEIN_MODIFICATION\(/ig, "pmod(");
    label = label.replace(/SUBSTITUTION\(/ig, "sub(");
    label = label.replace(/DEGRADATION\(/ig, "deg(");
    label = label.replace(/PATHOLOGY\(/ig, "path(");

    return label;
  };

  var getTerm = function(ndexNode, ndexNetwork) {
    var represents = ndexNode.represents;
    var functionTerm = ndexNetwork.functionTerms[represents];
    if (functionTerm === undefined){
      return []
    }
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
    if (represents !== undefined){
      var functionTerm = ndexNetwork.functionTerms[represents];
      if (functionTerm !== undefined){
      // Case 1 - BEL - node represents a function term
        var functionBaseTerm = ndexNetwork.baseTerms[functionTerm.functionTermId];
        console.log("functionString = " + functionBaseTerm.name);
        return functionBaseTerm.name;
      }
      var baseTerm = ndexNetwork.baseTerms[represents];
      if (baseTerm !== undefined){
        // Case 1 - BEL - node represents a base term that has a BEL expression as its name
        var name = baseTerm.name.toLowerCase();
        console.log("node represents bt: " + name);
          // so get substring between the first period and the first left paren
        var parenIndex = name.indexOf("(");
        if (parenIndex > 0){
            // found the left paren
            functionString = name.substring(0, parenIndex);
            console.log("functionString = " + functionString);
            return functionString.toUpperCase();
        }
      }
    }
    return "unknown"
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

		if (data.supports.length > 0){
      data.interaction = data.supports[0].text;
    } else {
      data.interaction = "no support";
    }

		return data;
	};

	var findTerm = function(termId, ndexNetwork) {
		var idString = termId.toString();
		var term = ndexNetwork.baseTerms[idString];
    console.log("findTerm = " + ndexHelper.getTermLabel(term, ndexNetwork));
		return ndexHelper.getTermLabel(term, ndexNetwork);
	};

}]);
