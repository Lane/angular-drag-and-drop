app = angular.module 'example', [
  'onlea.example'
  'onlea.ui.dragdrop'
]

example = angular.module "onlea.example", []

example.controller "ExampleController", [
  '$scope'
  ($scope) ->

    console.log "initialized"

    $scope.logThis = (message, draggable, droppable) ->
      console.log message,
        'draggable': draggable
        'droppable': droppable

]
