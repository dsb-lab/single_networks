(function(){
  document.addEventListener('DOMContentLoaded', function(){
    let $$ = selector => Array.from( document.querySelectorAll( selector ) );
    let $ = selector => document.querySelector( selector );

    let tryPromise = fn => Promise.resolve().then( fn );

    let toJson = obj => obj.json();
    let toText = obj => obj.text();

    let cy;

    let $dataset = $('#data');
    console.log($dataset.value)

    let getDataset = name => fetch(`datasets/${name}`).then( toJson );
    let applyDataset = dataset => {
      // so new eles are offscreen
      cy.zoom(0.001);
      cy.pan({ x: -9999999, y: -9999999 });

      // replace eles
      cy.elements().remove();
      cy.add( dataset );
    }
    let applyDatasetFromSelect = () => Promise.resolve( $dataset.value ).then( getDataset ).then( applyDataset );

    // set preset stylesheet
    styleName = 'custom.json'
    let convert = res => styleName.match(/[.]json$/) ? toJson(res) : toText(res);
    manualStyle = fetch(`stylesheets/${styleName}`).then( convert );
    let applyStylesheet = stylesheet => {
      if( typeof stylesheet === typeof '' ){
        cy.style().fromString( stylesheet ).update();
      } else {
        cy.style().fromJson( stylesheet ).update();
      }
    };
    let applyStylesheetFromSelect = () => Promise.resolve( manualStyle ).then( applyStylesheet );

    // get preset layout
    let options = {name:'preset',padding:20}
    let applyLayout = layout => {
      return cy.makeLayout( layout ).run().promiseOn('layoutstop');
    }
    let applyLayoutFromSelect = () => Promise.resolve( options ).then( applyLayout );

    cy = window.cy = cytoscape({
      container: $('#cy')
    });


    $dataset.addEventListener('change', function(){
      tryPromise( applyDatasetFromSelect );
    });

    tryPromise( applyDatasetFromSelect ).then( applyStylesheetFromSelect ).then( applyLayoutFromSelect );

    $dataset.addEventListener('change', function(){
      tryPromise( applyDatasetFromSelect ).then( applyStylesheetFromSelect ).then( applyLayoutFromSelect );
    });

    // Keith function for highlighting neighborhood
    cy.on("click", "node", function(event) {

      let clickNode = event.target
      let connectedNodes = clickNode.neighborhood().nodes();
      let remainingNodes = cy.nodes().not(connectedNodes);
      let connectedEdges = clickNode.neighborhood().edges();
      let remainingEdges = cy.edges().not(connectedEdges);
      let nNodes = cy.nodes().length;


      // make the remaining nodes more transparent
      remainingNodes.css({"border-color":"black",
              "border-width":"2",
              "opacity":"0.1"});

      connectedNodes.css({"border-color":"cyan",
              "border-width":"8",
              "opacity":"1"});

      clickNode.css(  {"border-color":"lime",
                  "border-width": "8",
                  "opacity":"1"});      


      // highlight positive and negative edges and increase thickness
      for (let i = 0; i < connectedEdges.length; i++){
          edge = connectedEdges[i]
          edge_thick = 3*edge.data("edge_thick")
          edge_trans = edge.data("edge_trans")
          weight = edge.data("weight")
          if (weight < 0) { line_color = "red" } else if (weight > 0) {line_color = "blue"}
          edge.css({"line-color":line_color,
                    "width":edge_thick,
                    "opacity":edge_trans}); // reset opacity from last click
      }

      // make the remaining edges more transparent
      for (let i = 0; i < remainingEdges.length; i++) {
          edge = remainingEdges[i]
          edge_trans = 0.1*edge.data("edge_trans")
          edge.css({"line-color":"black",
                    "opacity":edge_trans});
      }

      nodeList = connectedNodes.map(x => x.id());
      nodeStr = String(nodeList).replaceAll(',','\n');

      edgeList = connectedEdges.map(x => [ x.data("source"),
                                           x.data("target"), 
                                           x.data("weight") ] );
      for (let i = 0; i < edgeList.length; i++) {
          let [source,target,weight] = edgeList[i]
          if (source == clickNode.id()) {
              edgeList[i] = [weight,target]
          } else if (target == clickNode.id()) {
              edgeList[i] = [weight,source]
          }
      }

      edgeList = edgeList.sort( (a, b) => {return b[0] - a[0];} );
      edgeStr = String(edgeList).replaceAll(',','\n');

      console.log( "number of nodes " + nNodes + '\n'
                  + "current node " + this.id() + '\n' 
            			+ "degree  " + clickNode.data("degree") + '\n' );

      tableText = '';
      for (let i=0; i<edgeList.length; i++) {
          let [weight,node] = edgeList[i]
          weight = String(weight.toFixed(2))
          tableText += `${weight.padStart(5)} : ${node.padEnd(20)} \n` // funky apostrophes needed
      }

      // add the text of the nodes and weights
      htmlText = tableText.replaceAll('\n','<br>').replaceAll(' ','&nbsp;');
      document.getElementById('networkInfo').innerHTML = htmlText;

      // adjust dimensions of the box
      topPad = document.getElementById("networkInfo").style["padding-top"].replace('px','')
      lineHeight = document.getElementById("networkInfo").style["line-height"]
      fontSize = document.getElementById("networkInfo").style["font-size"].replace('px','');
      boxHeight = nodeList.length*parseFloat(lineHeight)*parseFloat(fontSize)+2*topPad
      StrHeight = String( Math.floor( boxHeight ) ) + 'px';
      document.getElementById("networkInfo").style.setProperty("height", StrHeight);
      
  	});
	
  });

})();

// tooltips with jQuery
$(document).ready(() => $('.tooltip').tooltipster());
