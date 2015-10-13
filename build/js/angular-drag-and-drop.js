var module;

module = angular.module("laneolson.ui.dragdrop", []);

module.directive('ngDragAndDrop', function() {
  return {
    restrict: 'E',
    scope: {
      onItemPlaced: "&",
      onItemRemoved: "&",
      onDrag: "&",
      onDragStart: "&",
      onDragEnd: "&",
      onDragEnter: "&",
      onDragLeave: "&"
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
                dropSpot.activate();
                results.push(this.fireCallback('drag-enter'));
              } else {
                results.push(void 0);
              }
            } else {
              if (dropSpot.isActive) {
                this.setCurrentDroppable(null);
                dropSpot.deactivate();
                results.push(this.fireCallback('drag-leave'));
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
            this.fireCallback('drag-start');
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
        this.fireCallback = function(type) {
          var state;
          state = {
            draggable: this.getCurrentDraggable(),
            droppable: this.getCurrentDroppable()
          };
          switch (type) {
            case 'drag-end':
              return typeof $scope.onDragEnd === "function" ? $scope.onDragEnd(state) : void 0;
            case 'drag-start':
              return typeof $scope.onDragStart === "function" ? $scope.onDragStart(state) : void 0;
            case 'drag':
              return typeof $scope.onDrag === "function" ? $scope.onDrag(state) : void 0;
            case 'item-assigned':
              return typeof $scope.onItemPlaced === "function" ? $scope.onItemPlaced(state) : void 0;
            case 'item-removed':
              return typeof $scope.onItemRemoved === "function" ? $scope.onItemRemoved(state) : void 0;
            case 'drag-leave':
              return typeof $scope.onDragLeave === "function" ? $scope.onDragLeave(state) : void 0;
            case 'drag-enter':
              return typeof $scope.onDragEnter === "function" ? $scope.onDragEnter(state) : void 0;
          }
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
          ngDragAndDrop.fireCallback('drag-end');
          draggable.deactivate();
          if (dropSpot && !dropSpot.isFull) {
            ngDragAndDrop.fireCallback('item-assigned');
            draggable.assignTo(dropSpot);
            dropSpot.itemDropped(draggable);
          } else {
            draggable.isAssigned = false;
            draggable.returnToStartPosition();
          }
          if (dropSpot) {
            dropSpot.deactivate();
          }
          return ngDragAndDrop.setCurrentDraggable(null);
        }
      };
      onMove = function(e) {
        var draggable;
        draggable = ngDragAndDrop.getCurrentDraggable();
        if (draggable) {
          ngDragAndDrop.fireCallback('drag');
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

module.directive('ngDrag', function($window) {
  return {
    restrict: 'EA',
    require: '^ngDragAndDrop',
    transclude: true,
    template: "<div class='drag-transform' " + "ng-class='{\"drag-active\": isDragging}' ng-style='dragStyle'>" + "<div class='drag-content' ng-class='{dropped: isAssigned}'" + " ng-transclude></div></div>",
    scope: {
      dropTo: "@",
      dragId: "@",
      dragData: "="
    },
    link: function(scope, element, attrs, ngDragAndDrop) {
      var bindEvents, eventOffset, height, onPress, unbindEvents, updateDimensions, w, width;
      if (scope.dragId) {
        element.addClass(scope.dragId);
      }
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
        scope.isAssigned = true;
        if (dropSpot.dropId) {
          return element.addClass("in-" + dropSpot.dropId);
        }
      };
      scope.removeFrom = function(dropSpot) {
        var index;
        index = scope.dropSpots.indexOf(dropSpot);
        if (index > -1) {
          if (dropSpot.dropId) {
            element.removeClass("in-" + dropSpot.dropId);
          }
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
        element.on(pressEvents, onPress);
        return w.bind("resize", updateDimensions);
      };
      unbindEvents = function() {
        element.off(pressEvents, onPress);
        element.off(releaseEvents, onRelease);
        return w.unbind("resize", updateDimensions);
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
          scope.removeFrom(dropSpot);
          return ngDragAndDrop.fireCallback('item-removed');
        }
      };
      w = angular.element($window);
      updateDimensions();
      ngDragAndDrop.addDraggable(scope);
      bindEvents();
      scope.returnToStartPosition();
      return scope.$on('$destroy', function() {
        return unbindEvents();
      });
    }
  };
});

module.directive('ngDrop', function($window) {
  return {
    restrict: 'AE',
    require: '^ngDragAndDrop',
    transclude: true,
    template: "<div class='drop-content' ng-class='{ \"drop-full\": isFull }' " + "ng-transclude></div>",
    scope: {
      dropId: "@",
      maxItems: "@"
    },
    link: function(scope, element, attrs, ngDragAndDrop) {
      var addItem, bindEvents, getDroppedPosition, unbindEvents, updateDimensions, w;
      updateDimensions = function() {
        scope.left = element[0].offsetLeft;
        scope.top = element[0].offsetTop;
        scope.right = scope.left + element[0].offsetWidth;
        return scope.bottom = scope.top + element[0].offsetHeight;
      };
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
            return item.updateOffset(newPos[0], newPos[1]);
          }
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
            return scope.isFull = false;
          }
        }
      };
      scope.activate = function() {
        scope.isActive = true;
        return element.addClass("drop-hovering");
      };
      scope.deactivate = function() {
        scope.isActive = false;
        ngDragAndDrop.setCurrentDroppable(null);
        return element.removeClass("drop-hovering");
      };
      bindEvents = function() {
        return w.bind("resize", updateDimensions);
      };
      unbindEvents = function() {
        return w.unbind("resize", updateDimensions);
      };
      if (scope.dropId) {
        element.addClass(scope.dropId);
      }
      w = angular.element($window);
      bindEvents();
      scope.$on('$destroy', function() {
        return unbindEvents();
      });
      updateDimensions();
      scope.isActive = false;
      scope.items = [];
      return ngDragAndDrop.addDroppable(scope);
    }
  };
});
