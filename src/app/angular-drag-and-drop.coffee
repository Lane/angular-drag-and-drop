# # Drag and Drop Directive

module = angular.module "laneolson.ui.dragdrop", []

module.directive 'dragAndDrop', ['$document', ($document) ->
  restrict: 'AE'
  scope:
    onItemPlaced: "&"
    onItemRemoved: "&"
    onDrag: "&"
    onDragStart: "&"
    onDragEnd: "&"
    onDragEnter: "&"
    onDragLeave: "&"
    enableSwap: "="
    fixedPositions: "="
  require: 'dragAndDrop'
  controller: [
    '$q'
    '$scope'
    ($q, $scope) ->

      $scope.draggables = draggables = []
      $scope.droppables = droppables = []
      $scope.isDragging = false
      $scope.currentDraggable = null
      currentDroppable = null
      element = null
      isReady = false

      handlers = []

      # Checks if a provided point is within the bounds object
      isInside = (point, bounds) ->
        return (bounds.left < point[0] < bounds.right and
                bounds.top < point[1] < bounds.bottom)

      # Checks if two rectangles intersect each other
      isIntersecting = (r1, r2) ->
        return !(r2.left > r1.right or
                 r2.right < r1.left or
                 r2.top > r1.bottom or
                 r2.bottom < r1.top)

      # registers a callback function to a specific event
      @on = (e, cb) ->
        # fire ready immediately if it's already ready
        if e is "ready" and isReady
          cb()
        handlers.push
          name: e
          cb: cb

      # triggers an event
      @trigger = (e) ->
        if e is "ready"
          isReady = true
        for h in handlers
          if h.name is e
            h.cb()

      # returns true if the drag and drop is ready
      @isReady = ->
        return isReady

      # set the element for the drag and drop
      @setDragAndDropElement = (el) ->
        element = el

      # get the element for the drag and drop
      @getDragAndDropElement = ->
        return element

      # checks all of the drop spots to see if the currently dragged
      # item is overtop of them
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

      # sets the item that is currently being dragged
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

      # returns the item that is currently being dragged
      @getCurrentDraggable = () ->
        return $scope.currentDraggable

      # sets the drop spot that the current drag item is over
      @setCurrentDroppable = (droppable) ->
        currentDroppable = droppable

      # returns the drop spot that the current drag item is over
      @getCurrentDroppable = () ->
        return currentDroppable

      # add a drop spot to the drag and drop
      @addDroppable = (droppable) ->
        droppables.push droppable

      # add a drag item to the drag and drop
      @addDraggable = (draggable) ->
        draggables.push draggable

      # fire any callback functions with the current state of the
      # drag and drop.
      @fireCallback = (type, e) ->
        state =
          draggable: @getCurrentDraggable()
          droppable: @getCurrentDroppable()
          dragEvent: e
        switch type
          when 'drag-end'
            $scope.onDragEnd?(state)
            @trigger "drag-end"
          when 'drag-start'
            $scope.onDragStart?(state)
            @trigger "drag-start"
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
    ngDragAndDrop.setDragAndDropElement element

    # binds touch / mouse events for moving and releasing items
    bindEvents = () ->
      $document.on moveEvents, onMove
      $document.on releaseEvents, onRelease
      ngDragAndDrop.on "drag-start", ->
        element.addClass "dragging"
      ngDragAndDrop.on "drag-end", ->
        element.removeClass "dragging"

    # unbinds events attached to the drag and drop container
    unbindEvents = () ->
      $document.off moveEvents, onMove
      $document.off releaseEvents, onRelease

    # when an item is released
    onRelease = (e) ->

      # get the item that is currently being dragged
      draggable = ngDragAndDrop.getCurrentDraggable()

      # get any drop spots that the draggable is currently over
      dropSpot = ngDragAndDrop.getCurrentDroppable()

      # deactivate the draggable
      if draggable
        element.addClass "drag-return"
        # NOTE: This is kind of a hack to allow the drag item to have
        # a return animation.  ngAnimate could be used for the animation
        # to prevent this.
        setTimeout ->
          element.removeClass "drag-return"
        , 500
        ngDragAndDrop.fireCallback 'drag-end', e
        draggable.deactivate()
        if dropSpot and not dropSpot.isFull
          # add the draggable to the drop spot if it isn't full
          ngDragAndDrop.fireCallback 'item-assigned', e
          draggable.assignTo dropSpot
          dropSpot.itemDropped draggable
        else if dropSpot and dropSpot.isFull and scope.enableSwap
          # swap
          dropSpot.items[0].returnToStartPosition()
          dropSpot.items[0].removeFrom dropSpot
          ngDragAndDrop.fireCallback 'item-assigned', e
          draggable.assignTo dropSpot
          dropSpot.itemDropped draggable
          ngDragAndDrop.fireCallback 'item-removed', e
        else
          # if released over nothing, remove the assignment

          draggable.isAssigned = false
          if scope.fixedPositions
            draggable.returnToStartPosition()
        if dropSpot
          dropSpot.deactivate()
        ngDragAndDrop.setCurrentDraggable null

    # when an item is moved
    onMove = (e) ->
      # if we're dragging, update the position
      draggable = ngDragAndDrop.getCurrentDraggable()
      if draggable
        ngDragAndDrop.fireCallback 'drag', e
        if e.touches and e.touches.length is 1
          # update position based on touch event
          draggable.updateOffset e.touches[0].clientX, e.touches[0].clientY
        else
          # update position based on mouse event
          draggable.updateOffset e.clientX, e.clientY
        # check if dragging over a drop spot
        ngDragAndDrop.checkForIntersection()

    # initialize
    bindEvents()

    ngDragAndDrop.trigger "ready"
]

# Drag Directive
# ----------
module.directive 'dragItem', [
  '$window', '$document', '$compile',
  ($window, $document, $compile) ->
    restrict: 'EA'
    require: '^dragAndDrop'
    scope:
      x: "@"
      y: "@"
      dropTo: "@"
      dragId: "@"
      dragEnabled: "="
      dragData: "="
      clone: "="
      lockHorizontal: "="
      lockVertical: "="
    link: (scope, element, attrs, ngDragAndDrop) ->

      cloneEl = width = height = startPosition = transformEl = eventOffset =
      pressEvents = w = null


      # set the position values on the drag item
      updateDimensions = () ->
        scope.left = scope.x + element[0].offsetLeft
        scope.right = scope.left + width
        scope.top = scope.y + element[0].offsetTop
        scope.bottom = scope.top + height
        scope.midPoint = [
          scope.left + width/2
          scope.top + height/2
        ]
        if scope.lockVertical
          # track the horizontal percentage position in the container
          # if we're locked vertically
          scope.percent = 100 *
            (scope.left + element[0].clientWidth/2) /
            element.parent()[0].clientWidth

          scope.percent = Math.min(100, Math.max(0, scope.percent))

      # set the position of the clone to where the element is
      setClonePosition = ->
        elemRect = element[0].getBoundingClientRect()
        leftOffset = elemRect.left + eventOffset[0]
        topOffset = elemRect.top + eventOffset[1]
        scope.updateOffset leftOffset, topOffset

      # set the position of an element based on a percentage
      # value, relative to the parent element
      scope.setPercentPostion = (xPercent,yPercent) ->
        newY =
          (element.parent()[0].clientHeight * (yPercent/100)) -
          element[0].clientHeight/2
        newX =
          (element.parent()[0].clientWidth * (xPercent/100)) -
          element[0].clientWidth/2
        scope.setPosition(newX, newY)

      # set the position of the transform element
      scope.setPosition = (x, y) ->
        scope.x = if scope.lockHorizontal then 0 else x
        scope.y = if scope.lockVertical then 0 else y
        updateDimensions()
        transformEl.css
          "transform": "translate(#{scope.x}px, #{scope.y}px)"
          "-webkit-transform": "translate(#{scope.x}px, #{scope.y}px)"
          "-ms-transform": "translate(#{scope.x}px, #{scope.y}px)"

      # update the x / y offset of the drag item and set the style
      scope.updateOffset = (x,y) ->
        if scope.clone
          # sometimes, you may want to offset the clone
          # scope.setPosition(
          #   x - cloneEl.prop("offsetWidth")/2,
          #   y - cloneEl.prop("offsetHeight")
          # )
          scope.setPosition(
            x - (eventOffset[0] + element[0].offsetLeft),
            y - (eventOffset[1] + element[0].offsetTop)
          )
        else
          scope.setPosition(
            x - (eventOffset[0] + element[0].offsetLeft),
            y - (eventOffset[1] + element[0].offsetTop)
          )

      # return the drag item to its original position
      scope.returnToStartPosition = ->
        scope.setPosition(
          startPosition[0],
          startPosition[1]
        )

      # assign the drag item to a drop spot
      scope.assignTo = (dropSpot) ->
        scope.dropSpots.push dropSpot
        scope.isAssigned = true
        if dropSpot.dropId
          element.addClass "in-#{dropSpot.dropId}"

      # finds the provided drop spot in the list of assigned drop spots
      # removes the drop spot from the list, and removes the draggable from
      # the drop spot.
      scope.removeFrom = (dropSpot) ->
        index = scope.dropSpots.indexOf dropSpot
        if index > -1
          if dropSpot.dropId
            element.removeClass "in-#{dropSpot.dropId}"
          scope.dropSpots.splice index, 1
          if scope.dropSpots.length < 1
            scope.isAssigned = false
          dropSpot.removeItem scope

      scope.addClass = (className) ->
        element.addClass className

      scope.removeClass = (className) ->
        element.removeClass className

      scope.toggleClass = (className) ->
        if element.hasClass className
          element.removeClass className
        else
          element.addClass className

      # sets dragging status on the drag item
      scope.activate = () ->
        element.addClass "drag-active"
        scope.isDragging = true

      # removes dragging status and resets the event offset
      scope.deactivate = () ->
        eventOffset = [0, 0]
        if scope.clone
          cloneEl.removeClass "clone-active"

        element.removeClass "drag-active"
        scope.isDragging = false

      # bind press and window resize to the drag item
      bindEvents = () ->
        element.on pressEvents, onPress
        w.bind "resize", updateDimensions

      # unbind press and window resize from the drag item
      unbindEvents = () ->
        element.off pressEvents, onPress
        w.unbind "resize", updateDimensions

      onPress = (e) ->
        unless scope.dragEnabled
          return
        if e.touches and e.touches.length is 1
          eventOffset = [
            (e.touches[0].clientX-scope.left)
            (e.touches[0].clientY-scope.top)
          ]
        else
          elemRect = element[0].getBoundingClientRect()
          eventOffset = [e.clientX - elemRect.left, e.clientY - elemRect.top]
        if scope.clone
          scope.returnToStartPosition()
          cloneEl.addClass "clone-active"
          setClonePosition()
        ngDragAndDrop.setCurrentDraggable scope
        scope.activate()
        scope.isAssigned = false
        ngDragAndDrop.checkForIntersection()
        dropSpot = ngDragAndDrop.getCurrentDroppable()
        for spot in scope.dropSpots
          scope.removeFrom spot
          ngDragAndDrop.fireCallback 'item-removed', e
        e.preventDefault()

      init = ->
        # add a class based on the drag ID
        if scope.dragId
          element.addClass scope.dragId

        # set starting values
        eventOffset = [0, 0]
        width = element[0].offsetWidth
        height = element[0].offsetHeight
        scope.dropSpots = []
        scope.isAssigned = false
        scope.x ?= 0
        scope.y ?= 0
        startPosition = [scope.x, scope.y]

        pressEvents = "touchstart mousedown"
        w = angular.element $window
        updateDimensions()
        ngDragAndDrop.addDraggable scope
        bindEvents()

        if scope.dragData
          angular.extend scope, scope.dragData

        if scope.clone
          scope[scope.dragData.key] = scope.dragData.value
          testing =
            $compile(angular.element("<div>"+element.html()+"</div>"))(scope)
          cloneEl = testing
          cloneEl.addClass "clone"
          cloneEl.addClass element.attr "class"
          angular.element(ngDragAndDrop.getDragAndDropElement()).append cloneEl

          transformEl = cloneEl
        else
          transformEl = element
        scope.returnToStartPosition()

        scope.$emit 'drag-ready', scope

        scope.$on '$destroy', ->
          unbindEvents()

      # initialization
      ngDragAndDrop.on "ready", init

]

# Drop Directive
# ----------
module.directive 'dropSpot', [ '$window', ($window) ->
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

    # calculates where the item should be dropped to based on its config
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
          if item.dropOffset
            xPos = scope.left + item.dropOffset[0]
            yPos = scope.top + item.dropOffset[1]

      return [xPos, yPos]

    scope.itemDropped = (item) ->
      added = addItem item
      if added
        if item.dropTo
          newPos = getDroppedPosition item
          item.updateOffset newPos[0], newPos[1]
        else
          item.dropOffset = [
            item.left - scope.left
            item.top - scope.top
          ]
      else
        if scope.fixedPositions
          item.returnToStartPosition()

    addItem = (item) ->
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

    handleResize = () ->
      updateDimensions()
      for item in scope.items
        newPos = getDroppedPosition(item)
        item.updateOffset newPos[0], newPos[1]

    bindEvents = ->
      w.bind "resize", handleResize

    unbindEvents = ->
      w.unbind "resize", handleResize

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

]
