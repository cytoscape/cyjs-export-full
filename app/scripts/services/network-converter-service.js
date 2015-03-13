var viewerApp = angular.module('cyViewerApp');

// Definition of NDEx --> Cytoscape.js converter service
viewerApp.service('networkConverterService', ['ndexHelper', function (ndexHelper) {

  this.name = 'converter service';

  this.toCytoscapeJs = function (ndexNetwork) {
    // build the new elements structure
    var elements = {
      nodes: [],
      edges: []
    };

    $.each(ndexNetwork.nodes, function (index, node) {

      var nodeData = getNodeData(index, node, ndexNetwork);
      var cyNode = {
        data: nodeData,
        position: getNodePosition(node.presentationProperties)
      };
      elements.nodes.push(cyNode);

    });

    $.each(ndexNetwork.edges, function (index, edge) {
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


  this.updateNdexNetwork = function (ndexNetwork, cyjsNetwork) {
    var nodes = cyjsNetwork.elements.nodes;
    var ndexNodes = ndexNetwork.nodes;

    _.each(nodes, function (node) {
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


  var getNetworkData = function (ndexNetwork) {
    var data = {};
    data.name = ndexNetwork.name;
    data.description = ndexNetwork.description;
    data.id = ndexNetwork.externalId;

    return data;
  };


  var labelMode = "friendly";

  var getNodeData = function (index, ndexNode, ndexNetwork) {
    var label = "unknown";
    if (labelMode === "friendly" && ndexNode.represents != undefined) {
      label = getFriendlyNodeLabel(ndexNode, ndexNetwork)
    } else {
      label = ndexHelper.getNodeLabel(ndexNode, ndexNetwork);
    }
    console.log("original Label = " + label);
    var hackedLabel = unspeakableNodeLabelHack(label);
    console.log("hacked Label = " + hackedLabel);
    if (hackedLabel) {
      label = hackedLabel;
    } else if (labelMode !== "friendly") {
      label = belAbbreviate(label);
    }
    console.log("node label = " + label);
    var data = {
      id: index.toString(),
      name: label,
      functionType: getFunctionType(ndexNode, ndexNetwork),
      terms: getTerm(ndexNode, ndexNetwork)
    };

    return data;
  };

  var unspeakableNodeLabelHack = function (label) {

    if (label === "PROTEIN_ABUNDANCE(HGNC:BRAF,bel:SUBSTITUTION(bel:V,bel:600,bel:E))") return "BRAF V600E";

    if (label === "PROTEIN_ABUNDANCE(HGNC:RPS6KB1,bel:PROTEIN_MODIFICATION(bel:P,bel:T,bel:444))") return "RPS6KB1 phosphorylated at T444";

    if (label === "ABUNDANCE(CHEBI:sorafenib tosylate)") return "sorafenib tosylate";

    if (label === "KINASE_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:BRAF))") return "activated BRAF";

    if (label === "PROTEIN_ABUNDANCE(HGNC:BRAF,bel:PROTEIN_MODIFICATION(bel:P,bel:S,bel:445))") return "BRAF phosphorylated at S445";

    if (label === "PROTEIN_ABUNDANCE(HGNC:NRAS,bel:SUBSTITUTION(bel:Q,bel:61,bel:R))") return "NRAS Q61R";

    if (label === "KINASE_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:AKT1))") return "activated AKT1";

    if (label === "CATALYTIC_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:TSC2))") return "activated TSC2";

    if (label === "PATHOLOGY(SDIS:Oncogene induced senescence)") return "Oncogene induced senescence";

    if (label === "GTP_BOUND_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:NRAS))") return "activated NRAS";

    if (label === "KINASE_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:ERBB4))") return "activated ERBB4";

    if (label === "KINASE_ACTIVITY(bel:PROTEIN_ABUNDANCE(PFH:PRKA Family))") return "activated PRKA Family";

    if (label === "PROTEIN_ABUNDANCE(HGNC:ERBB4,bel:PROTEIN_MODIFICATION(bel:P,bel:Y))") return "ERBB4 phosphorylated at Y";

    if (label === "PATHOLOGY(SDIS:tumor growth)") return "tumor growth";

    if (label === "KINASE_ACTIVITY(bel:PROTEIN_ABUNDANCE(HGNC:MAPK1))") return "activated MAPK1";

    return false;
  };

  // rules
  // baseTerm -> name
  // p(x) -> x
  // r(x) -> RNA x
  // act(x) -> activated x
  // mod(P, a, b) -> phosphrylated at ab
  // sub(a, b , c) -> abc

  var getFriendlyNodeLabel = function (node, network) {
    //if (!network) network = factory.getNodeNetwork(node);
    if ("name" in node && node.name && node.name != "") {
      //console.log(node.name);
      return node.name;
    }
    else if ("represents" in node && node.represents && network.terms[node.represents])
      return getFriendlyTermLabel(network.terms[node.represents], network);
    else
      return "unknown"
  };

  var getFriendlyTermLabel = function (term, network) {
    if (term.termType === "BaseTerm") {
      return term.name
    }
    else if (term.termType === "FunctionTerm") {
      var functionTerm = network.terms[term.functionTermId];
      if (!functionTerm) {
        console.log("no BaseTerm for functionTerm function by id " + term.functionTermId);
        return;
      }

      var ftname = functionTerm.name.toLowerCase();

      var sortedParameters = ndexHelper.getDictionaryKeysSorted(term.parameterIds);
      var parameterList = [];

      for (var parameterIndex = 0; parameterIndex < sortedParameters.length; parameterIndex++) {
        var parameterId = term.parameterIds[sortedParameters[parameterIndex]];
        var parameterTerm = network.terms[parameterId];

        if (parameterTerm)
          var parameterLabel = getFriendlyTermLabel(parameterTerm, network);
        else
          console.log("no parameterTerm by id " + parameterId);

        parameterList.push(parameterLabel);
      }
      var plistType = typeof(parameterList);
      console.log("parameterList = " + plistType + " : " + parameterList);

      if (ftname.indexOf("activity") > 0) {
        return "activated " + defaultParameterListFormat(parameterList);
      } else if (ftname === "substitution") {
        return parameterList.join("");
      } else if (ftname === "complex_abundance") {
        return "complex of " + parameterList.join(", ");
      } else if (ftname === "rna_abundance") {
        return defaultParameterListFormat(parameterList) + "RNA";
      } else if (ftname === "protein_modification") {
        var mod = parameterList[0];
        if (mod != undefined) {
          modCode = getModCode(parameterList);
          mod = mod.toLowerCase();

          if (mod === "p") {
            return "phosphorylated" + modCode;
          } else if (mod === "u") {
            return "ubiquitinated" + modCode;
          } else if (mod === "a") {
            return "acetylated" + modCode;
          } else if (mod === "f") {
            return "farnesylated" + modCode;
          } else if (mod === "g") {
            return "glycosylated" + modCode;
          } else if (mod === "h") {
            return "hydroxylated" + modCode;
          } else if (mod === "m") {
            return "methylated" + modCode;
          } else if (mod === "r") {
            return "ribosylated" + modCode;
          } else if (mod === "s") {
            return "sumoylated" + modCode;
          } else {
            return mod + modCode;
          }
        } else {
          return mod;
        }
      }
      else {
        return defaultParameterListFormat(parameterList);
      }
    }
    return "Unknown term type";
  };

  var getModCode = function (parameterList) {
    if (parameterList.length > 1) {
      parameterList.shift();
      console.log("about to join plist: " + parameterList);
      var modCode = parameterList.join("");
      return " at " + modCode;
    } else {
      return "";
    }
  };

  var defaultParameterListFormat = function (parameterList) {
    if (parameterList == undefined) {
      console.log("undefined parameter list!");
      return "";
    }
    if (parameterList.length == 1) {
      return parameterList[0];
    } else {
      // return the parameters with spaces
      return parameterList.join(" ");
    }
  };


  var belAbbreviate = function (input) {
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

  var getTerm = function (ndexNode, ndexNetwork) {
    var represents = ndexNode.represents;
    var functionTerm = ndexNetwork.functionTerms[represents];
    if (functionTerm === undefined) {
      return []
    }
    var parameterIds = functionTerm.parameterIds;
    return getParams(parameterIds, ndexNetwork, []);
  };

  var getParams = function (paramList, ndexNetwork, results) {
    _.each(paramList, function (id) {
      var param = ndexNetwork.baseTerms[id];
      if (param === undefined) {
        param = ndexNetwork.functionTerms[id];
        return getParams(param.parameterIds, ndexNetwork, results);
      }

      if (param !== undefined) {
        var nameSpace = ndexNetwork.namespaces[param.namespaceId];
        results.push({
          namespace: nameSpace.prefix,
          name: param.name
        });
      }
    });
    return results;

  }

  var getNodePosition = function (presentationProperties) {
    var position = {};
    var len = presentationProperties.length;
    for (var i = 0; i < len; i++) {
      var prop = presentationProperties[i];
      if (prop.name === 'x' || prop.name === 'y') {
        position[prop.name] = parseFloat(prop.value);
      }
    }

    return position;
  };


  // This is BEL specific.
  var getFunctionType = function (node, ndexNetwork) {
    var represents = node.represents;
    if (represents !== undefined) {
      var functionTerm = ndexNetwork.functionTerms[represents];
      if (functionTerm !== undefined) {
        // Case 1 - BEL - node represents a function term
        var functionBaseTerm = ndexNetwork.baseTerms[functionTerm.functionTermId];
        console.log("functionString = " + functionBaseTerm.name);
        return functionBaseTerm.name;
      }
      var baseTerm = ndexNetwork.baseTerms[represents];
      if (baseTerm !== undefined) {
        // Case 1 - BEL - node represents a base term that has a BEL expression as its name
        var name = baseTerm.name.toLowerCase();
        console.log("node represents bt: " + name);
        // so get substring between the first period and the first left paren
        var parenIndex = name.indexOf("(");
        if (parenIndex > 0) {
          // found the left paren
          functionString = name.substring(0, parenIndex);
          console.log("functionString = " + functionString);
          return functionString.toUpperCase();
        }
      }
    }
    return "unknown"
  };

  var getFunctionTermName = function (functionTerm) {
    var functionTermId = functionTerm.functionTermId;

    var parameters = functionTerm.parameterIds;
    var parameterTerms = [];
    _.each(parameters, function (parameter) {
      console.log(parameter);
      var term = ndexNetwork.baseTerms[parameter];
      if (term === undefined) {
        term = ndexNetwork.functionTerms[parameter];
      }
      parameterTerms.push(term);
    });

  };


  var getEdgeData = function (ndexEdge, ndexNetwork) {
    var data = {};
    data.source = ndexEdge.subjectId.toString();
    data.target = ndexEdge.objectId.toString();
    data.predicateId = findTerm(ndexEdge.predicateId, ndexNetwork);
    data.citations = [];

    var len = ndexEdge.citationIds.length;
    for (var idx = 0; idx < len; idx++) {
      var citationObj = ndexNetwork.citations[ndexEdge.citationIds[idx].toString()];
      data.citations.push(citationObj);
    }

    data.supports = [];
    len = ndexEdge.supportIds.length;
    for (var idx = 0; idx < len; idx++) {
      var supportObj = ndexNetwork.supports[ndexEdge.supportIds[idx].toString()];
      data.supports.push(supportObj);
    }

    if (data.supports.length > 0) {
      data.interaction = data.supports[0].text;
    } else {
      data.interaction = "no support";
    }

    return data;
  };

  var findTerm = function (termId, ndexNetwork) {
    var idString = termId.toString();
    var term = ndexNetwork.baseTerms[idString];
    console.log("findTerm = " + ndexHelper.getTermLabel(term, ndexNetwork));
    return ndexHelper.getTermLabel(term, ndexNetwork);
  };

}
])
;
