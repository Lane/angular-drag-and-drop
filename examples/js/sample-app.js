var app, example;

app = angular.module('example', ['onlea.example', 'onlea.ui.dragdrop']);

example = angular.module("onlea.example", []);

example.controller("ExampleController", [
  '$scope', function($scope) {
    console.log("initialized");
    return $scope.logThis = function(message, draggable, droppable) {
      return console.log(message, {
        'draggable': draggable,
        'droppable': droppable
      });
    };
  }
]);
