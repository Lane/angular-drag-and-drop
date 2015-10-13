app = angular.module 'example', [
  'laneolson.ui.dragdrop'
]

app.controller "ExampleController", [
  '$scope'
  ($scope) ->
    $scope.logThis = (message, draggable, droppable) ->
      console.log message,
        'draggable': draggable
        'droppable': droppable
]
