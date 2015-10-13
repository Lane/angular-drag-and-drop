var app;

app = angular.module('example', ['laneolson.ui.dragdrop']);

app.controller("ExampleController", [
  '$scope', function($scope) {
    return $scope.logThis = function(message, draggable, droppable) {
      return console.log(message, {
        'draggable': draggable,
        'droppable': droppable
      });
    };
  }
]);
