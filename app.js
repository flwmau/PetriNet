var application = angular.module("petriApplication", []).controller("graphPetri", function($scope){
    $scope.positionCount = 0;
    $scope.transitionCount = 0;
    $scope.inputFunction = {};
    $scope.outputFunction = {};
    $scope.currentTool = "gate";
    $scope.flag = false;
    $scope.positionTransitionArray = []; // {x: 10, y: 10, element: element};
    $scope.firstItem = "";
    $scope.secondItem = "";
    $scope.response = "";

    function log(){
        console.log("$scope.positionCount" + $scope.positionCount);
        console.log("$scope.transitionCount" + $scope.transitionCount);
        console.log("$scope.currentTool" + $scope.currentTool);
        for(var key in $scope.inputFunction){
            console.log($scope.inputFunction[key]);
            console.log($scope.outputFunction[key]);
        }

    }
    $scope.title = "PetriClient";
    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#myholder'),
        width: 700,
        height: 500,
        model: graph,
        gridSize: 10,
        perpendicularLinks: true,
        embeddingMode: true,
        markAvailable: true,
        snapLinks: true
    });

    var myAdjustVertices = _.partial(adjustVertices, graph);

// adjust vertices when a cell is removed or its source/target was changed
    graph.on('add remove change:source change:target', myAdjustVertices);

// also when an user stops interacting with an element.
    //paper.on('cell:pointerup', myAdjustVertices);



    var pn = joint.shapes.pn;
    var pCircle = new pn.Place({
        position: {x: 100, y:100},
        size: {width: 50, height: 50},
        attrs: {
            '.label': {text: 'p', fill: '#7c68fc'},
            '.root': { stroke: '#afafaf', 'stroke-width': 5},
            '.circle': {fill: '#7a7e9b'},
        },
        tokens: 0
    });
    var pTransition = new pn.Transition({
        position: {x:50, y:100},
        size: {width:15, height:50},
        attrs:{
            '.label': {text: 'protoGate', fill: '#fe854f'},
            '.root': {fill: '#9586fd', stoke: '#9586fd'}
        }
    });
    var paperSmall = new joint.dia.Paper({
        el: $('#preview'),
        width: 500,
        height: 200,
        model: graph,
        gridSize: 1
    });
    paperSmall.scale(.5);
    paperSmall.$el.css('pointer-events', 'none');

    //рисование картинок
    paper.on('blank:pointerdown', function(evt, x, y){
        //var parentOffset = $(this).parent().offset();
        //or $(this).offset(); if you really just want the current element's offset
        //var relX = evt.pageX - parentOffset.left;
        //var relY = evt.pageY - parentOffset.top;
        console.log(x + " " + y);
        //координаты знаю
        graph.addCell(getToolFromName($scope.currentTool, x, y));
        log();
    });
    $scope.sendJson = function(){
        


        var xhr = new XMLHttpRequest();
        var body = JSON.stringify(graph);
        xhr.open("POST", "localhost", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (this.readyState != 4) return;
            $scope.response = this.responseText;
        }
        xhr.send(JSON.stringify(body));






    }

    $scope.$watch('currentItem', function(newVal, oldVal){
        console.log($scope.firstItem);
    });

    //нажатие на элемент
    paper.on('cell:pointerclick', function(cellView, evt, x, y){
        $scope.currentItem = cellView.model.attr('.label').text;
        $scope.$apply();

        if($scope.currentTool == "deletepoint"){
            if(cellView.model instanceof joint.shapes.pn.Place && cellView.model.get('tokens')!=0){
                cellView.model.set('tokens', cellView.model.get('tokens')-1);
                return;
            }
        }

        if($scope.currentTool == "point") {
            if (cellView.model instanceof joint.shapes.pn.Place) {
                cellView.model.set('tokens', cellView.model.get('tokens') + 1);
                return;
            }else{
                return;
            }
        }
        if($scope.currentTool == "delete"){
            cellView.model.remove();
            return;
        }
        if($scope.firstItem !=null) {
            //не трогать линии
            if (cellView.model instanceof joint.shapes.pn.Link) {
                return;
            }
            //не соединять одинаковые элементы
            if (cellView.model.id === $scope.firstItem.id) {
                return;
            }
            //не соединять позиции
            if (cellView.model instanceof joint.shapes.pn.Place && $scope.firstItem instanceof joint.shapes.pn.Place) {
                return;
            }
            //не соединять переходики
            if (cellView.model instanceof joint.shapes.pn.Transition && $scope.firstItem instanceof joint.shapes.pn.Transition) {
                return;
            }
        }
        if($scope.flag == true && $scope.currentTool == "line"){
            console.log("create link");
            graph.addCell(link($scope.firstItem, cellView.model));
            $scope.flag = false;
            cellView.model.attr('rect/filter', { name: 'blur', args: { x: 0 } });
        }
        else{
            console.log("set first item");
            $scope.firstItem = cellView.model;

            $scope.flag = true;
            cellView.model.attr('rect/filter', { name: 'blur', args: { x: 1 } });
        }
    });

    //изменение инструмента
    $('#toolsForm input').on('change', function(){
        if($scope.flag == true){
            $scope.flag = false;
            $scope.firstItem.attr('rect/filter', { name: 'blur', args: { x: 0 } });
            $scope.firstItem = null;
        }

        $scope.currentTool = $('input[name=tool]:checked', '#toolsForm').val()
    });

    //Создание перехода
    function createTransition(prototype, x, y){
        var text = "t" + $scope.transitionCount++;
        $scope.inputFunction[text] = [0];
        $scope.outputFunction[text] = [0];
        return prototype.clone().attr({
            '.label': {text: text}
        }).position(x,y);
    }
    //Создание позиции
    function createPosition(prototype, x, y){
        return prototype.clone().attr({
            '.label': {text: "p"+$scope.positionCount++}
        }).position(x, y);
    }
    //Связывание двух элементов вместе
    function link(a, b) {
        return new pn.Link({
            source: { id: a.id, selector: '.root' },
            target: { id: b.id, selector: '.root' },
            attrs: {
                '.connection': {
                    'fill': 'none',
                    'stroke-linejoin': 'round',
                    'stroke-width': '2',
                    'stroke': '#4b4a67'
                }
            }
        });
    }

    function getToolFromName(toolName, x, y){
        switch(toolName) {
            case "gate":
                var item = createTransition(pTransition, x-7.5, y-25);
                return item;
            case "position":
                var item = createPosition(pCircle,x-25, y-25);
                return item;
            case "point":
            default:
                return "";
        }
    }

    function adjustVertices(graph, cell) {

        // If the cell is a view, find its model.
        cell = cell.model || cell;

        if (cell instanceof joint.dia.Element) {

            _.chain(graph.getConnectedLinks(cell)).groupBy(function(link) {
                // the key of the group is the model id of the link's source or target, but not our cell id.
                return _.omit([link.get('source').id, link.get('target').id], cell.id)[0];
            }).each(function(group, key) {
                // If the member of the group has both source and target model adjust vertices.
                if (key !== 'undefined') adjustVertices(graph, _.first(group));
            });

            return;
        }

        // The cell is a link. Let's find its source and target models.
        var srcId = cell.get('source').id || cell.previous('source').id;
        var trgId = cell.get('target').id || cell.previous('target').id;

        // If one of the ends is not a model, the link has no siblings.
        if (!srcId || !trgId) return;

        var siblings = _.filter(graph.getLinks(), function(sibling) {

            var _srcId = sibling.get('source').id;
            var _trgId = sibling.get('target').id;

            return (_srcId === srcId && _trgId === trgId) || (_srcId === trgId && _trgId === srcId);
        });

        switch (siblings.length) {

            case 0:
                // The link was removed and had no siblings.
                break;

            case 1:
                // There is only one link between the source and target. No vertices needed.
                cell.unset('vertices');
                break;

            default:

                // There is more than one siblings. We need to create vertices.

                // First of all we'll find the middle point of the link.
                var srcCenter = graph.getCell(srcId).getBBox().center();
                var trgCenter = graph.getCell(trgId).getBBox().center();
                var midPoint = g.line(srcCenter, trgCenter).midpoint();

                // Then find the angle it forms.
                var theta = srcCenter.theta(trgCenter);

                // This is the maximum distance between links
                var gap = 20;

                _.each(siblings, function(sibling, index) {

                    // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
                    var offset = gap * Math.ceil(index / 2);

                    // Now we need the vertices to be placed at points which are 'offset' pixels distant
                    // from the first link and forms a perpendicular angle to it. And as index goes up
                    // alternate left and right.
                    //
                    //  ^  odd indexes
                    //  |
                    //  |---->  index 0 line (straight line between a source center and a target center.
                    //  |
                    //  v  even indexes
                    var sign = index % 2 ? 1 : -1;
                    var angle = g.toRad(theta + sign * 90);

                    // We found the vertex.
                    var vertex = g.point.fromPolar(offset, angle, midPoint);

                    sibling.set('vertices', [{ x: vertex.x, y: vertex.y }]);
                });
        }
    };
    function angularApply($scope) {
            $scope.$apply();
    }
});







