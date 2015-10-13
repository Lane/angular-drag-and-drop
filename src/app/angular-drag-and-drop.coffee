module = angular.module "onlea.ui.dragdrop", []

module.directive 'ngDragAndDrop', ->
  restrict: 'E'
  scope:
    onDrop: "&"
    onDrag: "&"
    onDragStart: "&"
    onDragEnd: "&"
  require: 'ngDragAndDrop'
  transclude: true
  template: "<div class='drag-container' ng-class='{dragging: isDragging}' " +
    "ng-transclude></div>"
  controller: [
    '$q'
    '$scope'
    ($q, $scope) ->

      $scope.draggables = draggables = []
      $scope.droppables = droppables = []
      $scope.isDragging = false
      $scope.currentDraggable = null
      currentDroppable = null

      isInside = (point, bounds) ->
        return (bounds.left < point[0] < bounds.right and
                bounds.top < point[1] < bounds.bottom)

      isIntersecting = (r1, r2) ->
        return !(r2.left > r1.right or
                 r2.right < r1.left or
                 r2.top > r1.bottom or
                 r2.bottom < r1.top)

      @checkForIntersection = () ->
        for dropSpot in droppables
          if isInside $scope.currentDraggable.midPoint, dropSpot
            if !dropSpot.isActive
              @setCurrentDroppable dropSpot
              dropSpot.activate()
          else
            if dropSpot.isActive
              @setCurrentDroppable null
              dropSpot.deactivate()

      @setCurrentDraggable = (draggable) ->
        $scope.currentDraggable = draggable
        if draggable
          $scope.onDragStart?(
            draggable: draggable
          )
        $scope.$evalAsync ->
          $scope.currentDraggable = draggable
          if draggable
            $scope.isDragging = true
          else
            $scope.isDragging = false

      @getCurrentDraggable = () ->
        return $scope.currentDraggable

      @setCurrentDroppable = (droppable) ->
        currentDroppable = droppable

      @getCurrentDroppable = () ->
        return currentDroppable

      @addDroppable = (droppable) ->
        droppables.push droppable

      @addDraggable = (draggable) ->
        draggables.push draggable

      return

  ]
  link: (scope, element, attrs, ngDragAndDrop) ->

    moveEvents = "touchmove mousemove"
    releaseEvents = "touchend mouseup"

    bindEvents = () ->
      element.on moveEvents, onMove
      element.on releaseEvents, onRelease

    unbindEvents = () ->
      element.off moveEvents, onMove
      element.off releaseEvents, onRelease

    onRelease = () ->

      # get the item that is currently being dragged
      draggable = ngDragAndDrop.getCurrentDraggable()

      # get any drop spots that the draggable is currently over
      dropSpot = ngDragAndDrop.getCurrentDroppable()

      # deactivate the draggable
      if draggable
        draggable.deactivate()
        scope.onDragEnd?(
          draggable: draggable
        )
        ngDragAndDrop.setCurrentDraggable null

      # assign the draggable to the drop spot if there is one
      if draggable and dropSpot
        unless dropSpot.isFull
          draggable.assignTo dropSpot
        dropSpot.itemDropped draggable
        dropSpot.deactivate()

      # if released over nothing, remove the assignment
      if draggable and not dropSpot
        draggable.isAssigned = false
        draggable.returnToStartPosition()

    onMove = (e) ->
      # if we're dragging, update the position
      draggable = ngDragAndDrop.getCurrentDraggable()
      if draggable
        scope.onDrag?(
          draggable:draggable
        )
        if e.touches and e.touches.length is 1
          draggable.updateOffset e.touches[0].clientX, e.touches[0].clientY
        else
          draggable.updateOffset e.clientX, e.clientY
        ngDragAndDrop.checkForIntersection()

    bindEvents()

# Drag
# ----------
module.directive 'ngDrag', ->
  restrict: 'EA'
  require: '^ngDragAndDrop'
  transclude: true
  template: "<div class='drag-transform' " +
    "ng-class='{\"drag-active\": isDragging}' ng-style='dragStyle'>" +
    "<div class='drag-content' ng-class='{dropped: isAssigned}'" +
    " ng-transclude></div></div>"
  scope:
    dropTo: "@"
  link: (scope, element, attrs, ngDragAndDrop) ->

    eventOffset = [0, 0]
    width = element[0].offsetWidth
    height = element[0].offsetHeight

    scope.x = scope.y = 0

    scope.dropSpots = []
    scope.isAssigned = false
    scope.startPosition = [scope.left, scope.top]

    updateDimensions = () ->
      scope.left = scope.x + element[0].offsetLeft
      scope.right = scope.left + width
      scope.top = scope.y + element[0].offsetTop
      scope.bottom = scope.top + height
      scope.midPoint = [
        scope.left + width/2
        scope.top + height/2
      ]

    scope.updateOffset = (x,y) ->
      scope.x = x - (eventOffset[0] + element[0].offsetLeft)
      scope.y = y - (eventOffset[1] + element[0].offsetTop)

      updateDimensions()

      scope.$evalAsync ->
        scope.dragStyle =
          transform: "translate(#{scope.x}px, #{scope.y}px)"

    scope.returnToStartPosition = ->
      scope.x = scope.y = 0
      updateDimensions()
      scope.$evalAsync ->
        scope.dragStyle =
          transform: "translate(0px, 0px)"

    scope.assignTo = (dropSpot) ->
      scope.dropSpots.push dropSpot
      scope.isAssigned = true

    scope.removeFrom = (dropSpot) ->
      index = scope.dropSpots.indexOf dropSpot
      if index > -1
        scope.dropSpots.splice index, 1
        if scope.dropSpots.length < 1
          scope.isAssigned = false
        dropSpot.removeItem scope

    scope.activate = () ->
      scope.isDragging = true

    scope.deactivate = () ->
      eventOffset = [0, 0]
      scope.isDragging = false

    bindEvents = () ->
      pressEvents = "touchstart mousedown"
      element.on pressEvents, onPress

    unbindEvents = () ->
      element.off pressEvents, onPress
      element.off releaseEvents, onRelease

    onPress = (e) ->
      ngDragAndDrop.setCurrentDraggable scope
      scope.isDragging = true
      scope.isAssigned = false
      if e.touches and e.touches.length is 1
        eventOffset = [
          (e.touches[0].clientX-scope.left)
          (e.touches[0].clientY-scope.top)
        ]
      else
        eventOffset = [e.offsetX, e.offsetY]
      ngDragAndDrop.checkForIntersection()
      dropSpot = ngDragAndDrop.getCurrentDroppable()
      if dropSpot
        scope.removeFrom dropSpot

    updateDimensions()
    ngDragAndDrop.addDraggable scope
    bindEvents()
    scope.returnToStartPosition()

module.directive 'ngDrop', ->
  restrict: 'AE'
  require: '^ngDragAndDrop'
  transclude: true
  template: "<div class='drop-content' ng-class='{ \"drop-full\": isFull }' " +
    "ng-transclude></div>"
  scope:
    onDragEnter: "&"
    onDragLeave: "&"
    onPlaceItem: "&"
    onRemoveItem: "&"
    maxItems: "@"
  link: (scope, element, attrs, ngDragAndDrop) ->

    scope.left = element[0].offsetLeft
    scope.top = element[0].offsetTop
    scope.right = scope.left + element[0].offsetWidth
    scope.bottom = scope.top + element[0].offsetHeight
    scope.isActive = false
    scope.items = []

    getDroppedPosition = (item) ->
      dropSize = [
        (scope.right-scope.left)
        (scope.bottom-scope.top)
      ]
      itemSize = [
        (item.right-item.left)
        (item.bottom-item.top)
      ]
      switch item.dropTo
        when "top"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])/2
          yPos = scope.top
        when "bottom"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])/2
          yPos =
            scope.top + (dropSize[1] - itemSize[1])
        when "left"
          xPos = scope.left
          yPos =
            scope.top + (dropSize[1] - itemSize[1])/2
        when "right"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])
          yPos =
            scope.top + (dropSize[1] - itemSize[1])/2
        when "top left"
          xPos = scope.left
          yPos = scope.top
        when "bottom right"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])
          yPos =
            scope.top + (dropSize[1] - itemSize[1])
        when "bottom left"
          xPos = scope.left
          yPos =
            scope.top + (dropSize[1] - itemSize[1])
        when "top right"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])
          yPos = scope.top
        when "center"
          xPos =
            scope.left + (dropSize[0] - itemSize[0])/2
          yPos =
            scope.top + (dropSize[1] - itemSize[1])/2
        else
          xPos = 0
          yPos = 0

      return [xPos, yPos]

    scope.itemDropped = (item) ->
      added = addItem item
      if added
        if item.dropTo
          newPos = getDroppedPosition item
          item.updateOffset newPos[0], newPos[1]
        scope.onPlaceItem?(item, scope)
      else
        item.returnToStartPosition()

    addItem = (item) ->
      unless scope.isFull
        scope.items.push item
        if scope.items.length >= scope.maxItems
          scope.isFull = true
        scope.onPlaceItem?(scope, item)
        return item
      return false

    scope.removeItem = (item) ->
      index = scope.items.indexOf item
      if index > -1
        scope.items.splice index, 1
        if scope.items.length < scope.maxItems
          scope.isFull = false
        scope.onRemoveItem?(scope, item)

    scope.activate = () ->
      scope.isActive = true
      element.addClass "drop-hovering"
      scope.onDragEnter?(
        draggable: ngDragAndDrop.getCurrentDraggable()
        droppable: scope
      )

    scope.deactivate = () ->
      scope.isActive = false
      ngDragAndDrop.setCurrentDroppable null
      element.removeClass "drop-hovering"
      draggable = ngDragAndDrop.getCurrentDraggable()
      if draggable
        scope.onDragLeave?(
          draggable: draggable
          droppable: scope
        )

    ngDragAndDrop.addDroppable scope
