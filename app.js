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
        linkPinning: false,
        snapLinks: true
    });
    var pn = joint.shapes.pn;
    var pCircle = new pn.Place({
        position: {x: 100, y:100},
        size: {width: 50, height: 50},
        attrs: {
            '.label': {text: 'p', fill: '#7c68fc'},
            '.root': { stroke: '#afafaf', 'stroke-width': 1},
            '.circle': {fill: '#7a7e9b'}
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

    //нажатие на элемент
    paper.on('cell:pointerclick', function(cellView, evt, x, y){

        if($scope.currentTool == "point") {
            if (cellView.model instanceof joint.shapes.pn.Place) {
                cellView.model.set('tokens', cellView.model.get('tokens') + 1);
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
        }
        else{
            console.log("set first item");
            $scope.firstItem = cellView.model;
            $scope.flag = true;
        }
    });

    //изменение инструмента
    $('#toolsForm input').on('change', function(){
        if($scope.flag == true){
            $scope.flag = false;
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
});







