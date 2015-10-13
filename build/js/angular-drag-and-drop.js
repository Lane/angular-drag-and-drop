var module;

module = angular.module("onlea.ui.dragdrop", []);

module.directive('ngDragAndDrop', function() {
  return {
    restrict: 'E',
    scope: {
      onDrop: "&",
      onDrag: "&",
      onDragStart: "&",
      onDragEnd: "&"
    },
    require: 'ngDragAndDrop',
    transclude: true,
    template: "<div class='drag-container' ng-class='{dragging: isDragging}' " + "ng-transclude></div>",
    controller: [
      '$q', '$scope', function($q, $scope) {
        var currentDroppable, draggables, droppables, isInside, isIntersecting;
        $scope.draggables = draggables = [];
        $scope.droppables = droppables = [];
        $scope.isDragging = false;
        $scope.currentDraggable = null;
        currentDroppable = null;
        isInside = function(point, bounds) {
          var ref, ref1;
          return (bounds.left < (ref = point[0]) && ref < bounds.right) && (bounds.top < (ref1 = point[1]) && ref1 < bounds.bottom);
        };
        isIntersecting = function(r1, r2) {
          return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
        };
        this.checkForIntersection = function() {
          var dropSpot, i, len, results;
          results = [];
          for (i = 0, len = droppables.length; i < len; i++) {
            dropSpot = droppables[i];
            if (isInside($scope.currentDraggable.midPoint, dropSpot)) {
              if (!dropSpot.isActive) {
                this.setCurrentDroppable(dropSpot);
                results.push(dropSpot.activate());
              } else {
                results.push(void 0);
              }
            } else {
              if (dropSpot.isActive) {
                this.setCurrentDroppable(null);
                results.push(dropSpot.deactivate());
              } else {
                results.push(void 0);
              }
            }
          }
          return results;
        };
        this.setCurrentDraggable = function(draggable) {
          $scope.currentDraggable = draggable;
          if (draggable) {
            if (typeof $scope.onDragStart === "function") {
              $scope.onDragStart({
                draggable: draggable
              });
            }
          }
          return $scope.$evalAsync(function() {
            $scope.currentDraggable = draggable;
            if (draggable) {
              return $scope.isDragging = true;
            } else {
              return $scope.isDragging = false;
            }
          });
        };
        this.getCurrentDraggable = function() {
          return $scope.currentDraggable;
        };
        this.setCurrentDroppable = function(droppable) {
          return currentDroppable = droppable;
        };
        this.getCurrentDroppable = function() {
          return currentDroppable;
        };
        this.addDroppable = function(droppable) {
          return droppables.push(droppable);
        };
        this.addDraggable = function(draggable) {
          return draggables.push(draggable);
        };
      }
    ],
    link: function(scope, element, attrs, ngDragAndDrop) {
      var bindEvents, moveEvents, onMove, onRelease, releaseEvents, unbindEvents;
      moveEvents = "touchmove mousemove";
      releaseEvents = "touchend mouseup";
      bindEvents = function() {
        element.on(moveEvents, onMove);
        return element.on(releaseEvents, onRelease);
      };
      unbindEvents = function() {
        element.off(moveEvents, onMove);
        return element.off(releaseEvents, onRelease);
      };
      onRelease = function() {
        var draggable, dropSpot;
        draggable = ngDragAndDrop.getCurrentDraggable();
        dropSpot = ngDragAndDrop.getCurrentDroppable();
        if (draggable) {
          draggable.deactivate();
          if (typeof scope.onDragEnd === "function") {
            scope.onDragEnd({
              draggable: draggable
            });
          }
          ngDragAndDrop.setCurrentDraggable(null);
        }
        if (draggable && dropSpot) {
          if (!dropSpot.isFull) {
            draggable.assignTo(dropSpot);
          }
          dropSpot.itemDropped(draggable);
          dropSpot.deactivate();
        }
        if (draggable && !dropSpot) {
          draggable.isAssigned = false;
          return draggable.returnToStartPosition();
        }
      };
      onMove = function(e) {
        var draggable;
        draggable = ngDragAndDrop.getCurrentDraggable();
        if (draggable) {
          if (typeof scope.onDrag === "function") {
            scope.onDrag({
              draggable: draggable
            });
          }
          if (e.touches && e.touches.length === 1) {
            draggable.updateOffset(e.touches[0].clientX, e.touches[0].clientY);
          } else {
            draggable.updateOffset(e.clientX, e.clientY);
          }
          return ngDragAndDrop.checkForIntersection();
        }
      };
      return bindEvents();
    }
  };
});

module.directive('ngDrag', function() {
  return {
    restrict: 'EA',
    require: '^ngDragAndDrop',
    transclude: true,
    template: "<div class='drag-transform' " + "ng-class='{\"drag-active\": isDragging}' ng-style='dragStyle'>" + "<div class='drag-content' ng-class='{dropped: isAssigned}'" + " ng-transclude></div></div>",
    scope: {
      dropTo: "@"
    },
    link: function(scope, element, attrs, ngDragAndDrop) {
      var bindEvents, eventOffset, height, onPress, unbindEvents, updateDimensions, width;
      eventOffset = [0, 0];
      width = element[0].offsetWidth;
      height = element[0].offsetHeight;
      scope.x = scope.y = 0;
      scope.dropSpots = [];
      scope.isAssigned = false;
      scope.startPosition = [scope.left, scope.top];
      updateDimensions = function() {
        scope.left = scope.x + element[0].offsetLeft;
        scope.right = scope.left + width;
        scope.top = scope.y + element[0].offsetTop;
        scope.bottom = scope.top + height;
        return scope.midPoint = [scope.left + width / 2, scope.top + height / 2];
      };
      scope.updateOffset = function(x, y) {
        scope.x = x - (eventOffset[0] + element[0].offsetLeft);
        scope.y = y - (eventOffset[1] + element[0].offsetTop);
        updateDimensions();
        return scope.$evalAsync(function() {
          return scope.dragStyle = {
            transform: "translate(" + scope.x + "px, " + scope.y + "px)"
          };
        });
      };
      scope.returnToStartPosition = function() {
        scope.x = scope.y = 0;
        updateDimensions();
        return scope.$evalAsync(function() {
          return scope.dragStyle = {
            transform: "translate(0px, 0px)"
          };
        });
      };
      scope.assignTo = function(dropSpot) {
        scope.dropSpots.push(dropSpot);
        return scope.isAssigned = true;
      };
      scope.removeFrom = function(dropSpot) {
        var index;
        index = scope.dropSpots.indexOf(dropSpot);
        if (index > -1) {
          scope.dropSpots.splice(index, 1);
          if (scope.dropSpots.length < 1) {
            scope.isAssigned = false;
          }
          return dropSpot.removeItem(scope);
        }
      };
      scope.activate = function() {
        return scope.isDragging = true;
      };
      scope.deactivate = function() {
        eventOffset = [0, 0];
        return scope.isDragging = false;
      };
      bindEvents = function() {
        var pressEvents;
        pressEvents = "touchstart mousedown";
        return element.on(pressEvents, onPress);
      };
      unbindEvents = function() {
        element.off(pressEvents, onPress);
        return element.off(releaseEvents, onRelease);
      };
      onPress = function(e) {
        var dropSpot;
        ngDragAndDrop.setCurrentDraggable(scope);
        scope.isDragging = true;
        scope.isAssigned = false;
        if (e.touches && e.touches.length === 1) {
          eventOffset = [e.touches[0].clientX - scope.left, e.touches[0].clientY - scope.top];
        } else {
          eventOffset = [e.offsetX, e.offsetY];
        }
        ngDragAndDrop.checkForIntersection();
        dropSpot = ngDragAndDrop.getCurrentDroppable();
        if (dropSpot) {
          return scope.removeFrom(dropSpot);
        }
      };
      updateDimensions();
      ngDragAndDrop.addDraggable(scope);
      bindEvents();
      return scope.returnToStartPosition();
    }
  };
});

module.directive('ngDrop', function() {
  return {
    restrict: 'AE',
    require: '^ngDragAndDrop',
    transclude: true,
    template: "<div class='drop-content' ng-class='{ \"drop-full\": isFull }' " + "ng-transclude></div>",
    scope: {
      onDragEnter: "&",
      onDragLeave: "&",
      onPlaceItem: "&",
      onRemoveItem: "&",
      maxItems: "@"
    },
    link: function(scope, element, attrs, ngDragAndDrop) {
      var addItem, getDroppedPosition;
      scope.left = element[0].offsetLeft;
      scope.top = element[0].offsetTop;
      scope.right = scope.left + element[0].offsetWidth;
      scope.bottom = scope.top + element[0].offsetHeight;
      scope.isActive = false;
      scope.items = [];
      getDroppedPosition = function(item) {
        var dropSize, itemSize, xPos, yPos;
        dropSize = [scope.right - scope.left, scope.bottom - scope.top];
        itemSize = [item.right - item.left, item.bottom - item.top];
        switch (item.dropTo) {
          case "top":
            xPos = scope.left + (dropSize[0] - itemSize[0]) / 2;
            yPos = scope.top;
            break;
          case "bottom":
            xPos = scope.left + (dropSize[0] - itemSize[0]) / 2;
            yPos = scope.top + (dropSize[1] - itemSize[1]);
            break;
          case "left":
            xPos = scope.left;
            yPos = scope.top + (dropSize[1] - itemSize[1]) / 2;
            break;
          case "right":
            xPos = scope.left + (dropSize[0] - itemSize[0]);
            yPos = scope.top + (dropSize[1] - itemSize[1]) / 2;
            break;
          case "top left":
            xPos = scope.left;
            yPos = scope.top;
            break;
          case "bottom right":
            xPos = scope.left + (dropSize[0] - itemSize[0]);
            yPos = scope.top + (dropSize[1] - itemSize[1]);
            break;
          case "bottom left":
            xPos = scope.left;
            yPos = scope.top + (dropSize[1] - itemSize[1]);
            break;
          case "top right":
            xPos = scope.left + (dropSize[0] - itemSize[0]);
            yPos = scope.top;
            break;
          case "center":
            xPos = scope.left + (dropSize[0] - itemSize[0]) / 2;
            yPos = scope.top + (dropSize[1] - itemSize[1]) / 2;
            break;
          default:
            xPos = 0;
            yPos = 0;
        }
        return [xPos, yPos];
      };
      scope.itemDropped = function(item) {
        var added, newPos;
        added = addItem(item);
        if (added) {
          if (item.dropTo) {
            newPos = getDroppedPosition(item);
            item.updateOffset(newPos[0], newPos[1]);
          }
          return typeof scope.onPlaceItem === "function" ? scope.onPlaceItem(item, scope) : void 0;
        } else {
          return item.returnToStartPosition();
        }
      };
      addItem = function(item) {
        if (!scope.isFull) {
          scope.items.push(item);
          if (scope.items.length >= scope.maxItems) {
            scope.isFull = true;
          }
          if (typeof scope.onPlaceItem === "function") {
            scope.onPlaceItem(scope, item);
          }
          return item;
        }
        return false;
      };
      scope.removeItem = function(item) {
        var index;
        index = scope.items.indexOf(item);
        if (index > -1) {
          scope.items.splice(index, 1);
          if (scope.items.length < scope.maxItems) {
            scope.isFull = false;
          }
          return typeof scope.onRemoveItem === "function" ? scope.onRemoveItem(scope, item) : void 0;
        }
      };
      scope.activate = function() {
        scope.isActive = true;
        element.addClass("drop-hovering");
        return typeof scope.onDragEnter === "function" ? scope.onDragEnter({
          draggable: ngDragAndDrop.getCurrentDraggable(),
          droppable: scope
        }) : void 0;
      };
      scope.deactivate = function() {
        var draggable;
        scope.isActive = false;
        ngDragAndDrop.setCurrentDroppable(null);
        element.removeClass("drop-hovering");
        draggable = ngDragAndDrop.getCurrentDraggable();
        if (draggable) {
          return typeof scope.onDragLeave === "function" ? scope.onDragLeave({
            draggable: draggable,
            droppable: scope
          }) : void 0;
        }
      };
      return ngDragAndDrop.addDroppable(scope);
    }
  };
});
