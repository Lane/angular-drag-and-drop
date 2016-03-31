var module;

module = angular.module("laneolson.ui.dragdrop", []);

module.directive('dragAndDrop', [
  '$document', function($document) {
    return {
      restrict: 'AE',
      scope: {
        onItemPlaced: "&",
        onItemRemoved: "&",
        onDrag: "&",
        onDragStart: "&",
        onDragEnd: "&",
        onDragEnter: "&",
        onDragLeave: "&",
        enableSwap: "=",
        fixedPositions: "="
      },
      require: 'dragAndDrop',
      controller: [
        '$q', '$scope', function($q, $scope) {
          var currentDroppable, draggables, droppables, element, handlers, isInside, isIntersecting, isReady;
          $scope.draggables = draggables = [];
          $scope.droppables = droppables = [];
          $scope.isDragging = false;
          $scope.currentDraggable = null;
          currentDroppable = null;
          element = null;
          isReady = false;
          handlers = [];
          isInside = function(point, bounds) {
            var ref, ref1;
            return (bounds.left < (ref = point[0]) && ref < bounds.right) && (bounds.top < (ref1 = point[1]) && ref1 < bounds.bottom);
          };
          isIntersecting = function(r1, r2) {
            return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
          };
          this.on = function(e, cb) {
            if (e === "ready" && isReady) {
              cb();
            }
            return handlers.push({
              name: e,
              cb: cb
            });
          };
          this.trigger = function(e) {
            var h, i, len, results;
            if (e === "ready") {
              isReady = true;
            }
            results = [];
            for (i = 0, len = handlers.length; i < len; i++) {
              h = handlers[i];
              if (h.name === e) {
                results.push(h.cb());
              } else {
                results.push(void 0);
              }
            }
            return results;
          };
          this.isReady = function() {
            return isReady;
          };
          this.setDragAndDropElement = function(el) {
            return element = el;
          };
          this.getDragAndDropElement = function() {
            return element;
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
          this.fireCallback = function(type, e) {
            var state;
            state = {
              draggable: this.getCurrentDraggable(),
              droppable: this.getCurrentDroppable(),
              dragEvent: e
            };
            switch (type) {
              case 'drag-end':
                if (typeof $scope.onDragEnd === "function") {
                  $scope.onDragEnd(state);
                }
                return this.trigger("drag-end");
              case 'drag-start':
                if (typeof $scope.onDragStart === "function") {
                  $scope.onDragStart(state);
                }
                return this.trigger("drag-start");
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
        ngDragAndDrop.setDragAndDropElement(element);
        bindEvents = function() {
          $document.on(moveEvents, onMove);
          $document.on(releaseEvents, onRelease);
          ngDragAndDrop.on("drag-start", function() {
            return element.addClass("dragging");
          });
          return ngDragAndDrop.on("drag-end", function() {
            return element.removeClass("dragging");
          });
        };
        unbindEvents = function() {
          $document.off(moveEvents, onMove);
          return $document.off(releaseEvents, onRelease);
        };
        onRelease = function(e) {
          var draggable, dropSpot;
          draggable = ngDragAndDrop.getCurrentDraggable();
          dropSpot = ngDragAndDrop.getCurrentDroppable();
          if (draggable) {
            element.addClass("drag-return");
            setTimeout(function() {
              return element.removeClass("drag-return");
            }, 500);
            ngDragAndDrop.fireCallback('drag-end', e);
            draggable.deactivate();
            if (dropSpot && !dropSpot.isFull) {
              ngDragAndDrop.fireCallback('item-assigned', e);
              draggable.assignTo(dropSpot);
              dropSpot.itemDropped(draggable);
            } else if (dropSpot && dropSpot.isFull && scope.enableSwap) {
              dropSpot.items[0].returnToStartPosition();
              dropSpot.items[0].removeFrom(dropSpot);
              ngDragAndDrop.fireCallback('item-assigned', e);
              draggable.assignTo(dropSpot);
              dropSpot.itemDropped(draggable);
              ngDragAndDrop.fireCallback('item-removed', e);
            } else {
              draggable.isAssigned = false;
              if (scope.fixedPositions) {
                draggable.returnToStartPosition();
              }
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
            ngDragAndDrop.fireCallback('drag', e);
            if (e.touches && e.touches.length === 1) {
              draggable.updateOffset(e.touches[0].clientX, e.touches[0].clientY);
            } else {
              draggable.updateOffset(e.clientX, e.clientY);
            }
            return ngDragAndDrop.checkForIntersection();
          }
        };
        bindEvents();
        return ngDragAndDrop.trigger("ready");
      }
    };
  }
]);

module.directive('dragItem', [
  '$window', '$document', '$compile', function($window, $document, $compile) {
    return {
      restrict: 'EA',
      require: '^dragAndDrop',
      scope: {
        x: "@",
        y: "@",
        dropTo: "@",
        dragId: "@",
        dragEnabled: "=",
        dragData: "=",
        clone: "=",
        lockHorizontal: "=",
        lockVertical: "="
      },
      link: function(scope, element, attrs, ngDragAndDrop) {
        var bindEvents, cloneEl, eventOffset, height, init, onPress, pressEvents, setClonePosition, startPosition, transformEl, unbindEvents, updateDimensions, w, width;
        cloneEl = width = height = startPosition = transformEl = eventOffset = pressEvents = w = null;
        updateDimensions = function() {
          scope.left = scope.x + element[0].offsetLeft;
          scope.right = scope.left + width;
          scope.top = scope.y + element[0].offsetTop;
          scope.bottom = scope.top + height;
          scope.midPoint = [scope.left + width / 2, scope.top + height / 2];
          if (scope.lockVertical) {
            scope.percent = 100 * (scope.left + element[0].clientWidth / 2) / element.parent()[0].clientWidth;
            return scope.percent = Math.min(100, Math.max(0, scope.percent));
          }
        };
        setClonePosition = function() {
          var elemRect, leftOffset, topOffset;
          elemRect = element[0].getBoundingClientRect();
          leftOffset = elemRect.left + eventOffset[0];
          topOffset = elemRect.top + eventOffset[1];
          return scope.updateOffset(leftOffset, topOffset);
        };
        scope.setPercentPostion = function(xPercent, yPercent) {
          var newX, newY;
          newY = (element.parent()[0].clientHeight * (yPercent / 100)) - element[0].clientHeight / 2;
          newX = (element.parent()[0].clientWidth * (xPercent / 100)) - element[0].clientWidth / 2;
          return scope.setPosition(newX, newY);
        };
        scope.setPosition = function(x, y) {
          scope.x = scope.lockHorizontal ? 0 : x;
          scope.y = scope.lockVertical ? 0 : y;
          updateDimensions();
          return transformEl.css({
            "transform": "translate(" + scope.x + "px, " + scope.y + "px)",
            "-webkit-transform": "translate(" + scope.x + "px, " + scope.y + "px)",
            "-ms-transform": "translate(" + scope.x + "px, " + scope.y + "px)"
          });
        };
        scope.updateOffset = function(x, y) {
          if (scope.clone) {
            return scope.setPosition(x - (eventOffset[0] + element[0].offsetLeft), y - (eventOffset[1] + element[0].offsetTop));
          } else {
            return scope.setPosition(x - (eventOffset[0] + element[0].offsetLeft), y - (eventOffset[1] + element[0].offsetTop));
          }
        };
        scope.returnToStartPosition = function() {
          return scope.setPosition(startPosition[0], startPosition[1]);
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
        scope.addClass = function(className) {
          return element.addClass(className);
        };
        scope.removeClass = function(className) {
          return element.removeClass(className);
        };
        scope.toggleClass = function(className) {
          if (element.hasClass(className)) {
            return element.removeClass(className);
          } else {
            return element.addClass(className);
          }
        };
        scope.activate = function() {
          element.addClass("drag-active");
          return scope.isDragging = true;
        };
        scope.deactivate = function() {
          eventOffset = [0, 0];
          if (scope.clone) {
            cloneEl.removeClass("clone-active");
          }
          element.removeClass("drag-active");
          return scope.isDragging = false;
        };
        bindEvents = function() {
          element.on(pressEvents, onPress);
          return w.bind("resize", updateDimensions);
        };
        unbindEvents = function() {
          element.off(pressEvents, onPress);
          return w.unbind("resize", updateDimensions);
        };
        onPress = function(e) {
          var dropSpot, elemRect, i, len, ref, spot;
          if (!scope.dragEnabled) {
            return;
          }
          if (e.touches && e.touches.length === 1) {
            eventOffset = [e.touches[0].clientX - scope.left, e.touches[0].clientY - scope.top];
          } else {
            elemRect = element[0].getBoundingClientRect();
            eventOffset = [e.clientX - elemRect.left, e.clientY - elemRect.top];
          }
          if (scope.clone) {
            scope.returnToStartPosition();
            cloneEl.addClass("clone-active");
            setClonePosition();
          }
          ngDragAndDrop.setCurrentDraggable(scope);
          scope.activate();
          scope.isAssigned = false;
          ngDragAndDrop.checkForIntersection();
          dropSpot = ngDragAndDrop.getCurrentDroppable();
          ref = scope.dropSpots;
          for (i = 0, len = ref.length; i < len; i++) {
            spot = ref[i];
            scope.removeFrom(spot);
            ngDragAndDrop.fireCallback('item-removed', e);
          }
          return e.preventDefault();
        };
        init = function() {
          var testing;
          if (scope.dragId) {
            element.addClass(scope.dragId);
          }
          eventOffset = [0, 0];
          width = element[0].offsetWidth;
          height = element[0].offsetHeight;
          scope.dropSpots = [];
          scope.isAssigned = false;
          if (scope.x == null) {
            scope.x = 0;
          }
          if (scope.y == null) {
            scope.y = 0;
          }
          startPosition = [scope.x, scope.y];
          pressEvents = "touchstart mousedown";
          w = angular.element($window);
          updateDimensions();
          ngDragAndDrop.addDraggable(scope);
          bindEvents();
          if (scope.dragData) {
            angular.extend(scope, scope.dragData);
          }
          if (scope.clone) {
            scope[scope.dragData.key] = scope.dragData.value;
            testing = $compile(angular.element("<div>" + element.html() + "</div>"))(scope);
            cloneEl = testing;
            cloneEl.addClass("clone");
            cloneEl.addClass(element.attr("class"));
            angular.element(ngDragAndDrop.getDragAndDropElement()).append(cloneEl);
            transformEl = cloneEl;
          } else {
            transformEl = element;
          }
          scope.returnToStartPosition();
          scope.$emit('drag-ready', scope);
          return scope.$on('$destroy', function() {
            return unbindEvents();
          });
        };
        return ngDragAndDrop.on("ready", init);
      }
    };
  }
]);

module.directive('dropSpot', [
  '$window', function($window) {
    return {
      restrict: 'AE',
      require: '^dragAndDrop',
      transclude: true,
      template: "<div class='drop-content' ng-class='{ \"drop-full\": isFull }' " + "ng-transclude></div>",
      scope: {
        dropId: "@",
        maxItems: "="
      },
      link: function(scope, element, attrs, ngDragAndDrop) {
        var addItem, bindEvents, getDroppedPosition, handleResize, unbindEvents, updateDimensions, w;
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
              if (item.dropOffset) {
                xPos = scope.left + item.dropOffset[0];
                yPos = scope.top + item.dropOffset[1];
              }
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
            } else {
              return item.dropOffset = [item.left - scope.left, item.top - scope.top];
            }
          } else {
            if (scope.fixedPositions) {
              return item.returnToStartPosition();
            }
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
        handleResize = function() {
          var i, item, len, newPos, ref, results;
          updateDimensions();
          ref = scope.items;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            newPos = getDroppedPosition(item);
            results.push(item.updateOffset(newPos[0], newPos[1]));
          }
          return results;
        };
        bindEvents = function() {
          return w.bind("resize", handleResize);
        };
        unbindEvents = function() {
          return w.unbind("resize", handleResize);
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
  }
]);
