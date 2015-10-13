module = angular.module "laneolson.ui.dragdrop", []

# Drag and Drop Directive
# ----------
module.directive 'dragAndDrop', ->
  restrict: 'E'
  scope:
    onItemPlaced: "&"
    onItemRemoved: "&"
    onDrag: "&"
    onDragStart: "&"
    onDragEnd: "&"
    onDragEnter: "&"
    onDragLeave: "&"
    enableSwap: "="
  require: 'dragAndDrop'
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
              @fireCallback 'drag-enter'
          else
            if dropSpot.isActive
              @setCurrentDroppable null
              dropSpot.deactivate()
              @fireCallback 'drag-leave'

      @setCurrentDraggable = (draggable) ->
        $scope.currentDraggable = draggable
        if draggable
          @fireCallback 'drag-start'
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

      @fireCallback = (type) ->
        state =
          draggable: @getCurrentDraggable()
          droppable: @getCurrentDroppable()
        switch type
          when 'drag-end'
            $scope.onDragEnd?(state)
          when 'drag-start'
            $scope.onDragStart?(state)
          when 'drag'
            $scope.onDrag?(state)
          when 'item-assigned'
            $scope.onItemPlaced?(state)
          when 'item-removed'
            $scope.onItemRemoved?(state)
          when 'drag-leave'
            $scope.onDragLeave?(state)
          when 'drag-enter'
            $scope.onDragEnter?(state)

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
        ngDragAndDrop.fireCallback 'drag-end'
        draggable.deactivate()
        if dropSpot and not dropSpot.isFull
          # add the draggable to the drop spot if it isn't full
          ngDragAndDrop.fireCallback 'item-assigned'
          draggable.assignTo dropSpot
          dropSpot.itemDropped draggable
        else if dropSpot and dropSpot.isFull and scope.enableSwap
          # swap
          dropSpot.items[0].returnToStartPosition()
          dropSpot.items[0].removeFrom dropSpot
          ngDragAndDrop.fireCallback 'item-assigned'
          draggable.assignTo dropSpot
          dropSpot.itemDropped draggable
        else
          # if released over nothing, remove the assignment
          draggable.isAssigned = false
          draggable.returnToStartPosition()
        if dropSpot
          dropSpot.deactivate()
        ngDragAndDrop.setCurrentDraggable null

    onMove = (e) ->
      # if we're dragging, update the position
      draggable = ngDragAndDrop.getCurrentDraggable()
      if draggable
        ngDragAndDrop.fireCallback 'drag'
        if e.touches and e.touches.length is 1
          draggable.updateOffset e.touches[0].clientX, e.touches[0].clientY
        else
          draggable.updateOffset e.clientX, e.clientY
        ngDragAndDrop.checkForIntersection()

    bindEvents()


# Drag Directive
# ----------
module.directive 'dragItem', ($window) ->
  restrict: 'EA'
  require: '^dragAndDrop'
  transclude: true
  template: "<div class='drag-transform' " +
    "ng-class='{\"drag-active\": isDragging}' ng-style='dragStyle'>" +
    "<div class='drag-content' ng-class='{dropped: isAssigned}'" +
    " ng-transclude></div></div>"
  scope:
    x: "@"
    y: "@"
    dropTo: "@"
    dragId: "@"
    dragData: "="
  link: (scope, element, attrs, ngDragAndDrop) ->

    if scope.dragId
      element.addClass scope.dragId

    eventOffset = [0, 0]
    width = element[0].offsetWidth
    height = element[0].offsetHeight

    unless scope.x
      scope.x = 0
    unless scope.y
      scope.y = 0

    scope.dropSpots = []
    scope.isAssigned = false
    startPosition = [scope.x, scope.y]

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
      scope.x = startPosition[0]
      scope.y = startPosition[1]
      updateDimensions()
      scope.$evalAsync ->
        scope.dragStyle =
          transform: "translate(#{scope.x}px, #{scope.y}px)"

    scope.assignTo = (dropSpot) ->
      scope.dropSpots.push dropSpot
      scope.isAssigned = true
      if dropSpot.dropId
        element.addClass "in-#{dropSpot.dropId}"

    scope.removeFrom = (dropSpot) ->
      index = scope.dropSpots.indexOf dropSpot
      if index > -1
        if dropSpot.dropId
          element.removeClass "in-#{dropSpot.dropId}"
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
      element.on pressEvents, onPress
      w.bind "resize", updateDimensions

    unbindEvents = () ->
      element.off pressEvents, onPress
      w.unbind "resize", updateDimensions

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
        ngDragAndDrop.fireCallback 'item-removed'

    # initialization
    pressEvents = "touchstart mousedown"
    w = angular.element $window
    updateDimensions()
    ngDragAndDrop.addDraggable scope
    bindEvents()
    scope.returnToStartPosition()

    scope.$on '$destroy', ->
      unbindEvents()


# Drop Directive
# ----------
module.directive 'dropSpot', ($window) ->
  restrict: 'AE'
  require: '^dragAndDrop'
  transclude: true
  template: "<div class='drop-content' ng-class='{ \"drop-full\": isFull }' "+
    "ng-transclude></div>"
  scope:
    dropId: "@"
    maxItems: "="
  link: (scope, element, attrs, ngDragAndDrop) ->

    updateDimensions = ->
      scope.left = element[0].offsetLeft
      scope.top = element[0].offsetTop
      scope.right = scope.left + element[0].offsetWidth
      scope.bottom = scope.top + element[0].offsetHeight

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
          xPos = scope.left + (dropSize[0] - itemSize[0])/2
          yPos = scope.top
        when "bottom"
          xPos = scope.left + (dropSize[0] - itemSize[0])/2
          yPos = scope.top + (dropSize[1] - itemSize[1])
        when "left"
          xPos = scope.left
          yPos = scope.top + (dropSize[1] - itemSize[1])/2
        when "right"
          xPos = scope.left + (dropSize[0] - itemSize[0])
          yPos = scope.top + (dropSize[1] - itemSize[1])/2
        when "top left"
          xPos = scope.left
          yPos = scope.top
        when "bottom right"
          xPos = scope.left + (dropSize[0] - itemSize[0])
          yPos = scope.top + (dropSize[1] - itemSize[1])
        when "bottom left"
          xPos = scope.left
          yPos = scope.top + (dropSize[1] - itemSize[1])
        when "top right"
          xPos = scope.left + (dropSize[0] - itemSize[0])
          yPos = scope.top
        when "center"
          xPos = scope.left + (dropSize[0] - itemSize[0])/2
          yPos = scope.top + (dropSize[1] - itemSize[1])/2
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
      else
        item.returnToStartPosition()

    addItem = (item) ->
      console.log "ADDING ITEM", scope.isFull, scope.items.length, scope.maxItems
      unless scope.isFull
        scope.items.push item
        if scope.items.length >= scope.maxItems
          scope.isFull = true
        return item
      return false

    scope.removeItem = (item) ->
      index = scope.items.indexOf item
      if index > -1
        scope.items.splice index, 1
        if scope.items.length < scope.maxItems
          scope.isFull = false

    scope.activate = () ->
      scope.isActive = true
      element.addClass "drop-hovering"

    scope.deactivate = () ->
      scope.isActive = false
      ngDragAndDrop.setCurrentDroppable null
      element.removeClass "drop-hovering"

    bindEvents = ->
      w.bind "resize", updateDimensions

    unbindEvents = ->
      w.unbind "resize", updateDimensions

    if scope.dropId
      element.addClass scope.dropId

    w = angular.element $window
    bindEvents()

    scope.$on '$destroy', ->
      unbindEvents()

    # initialization
    updateDimensions()
    scope.isActive = false
    scope.items = []
    ngDragAndDrop.addDroppable scope
