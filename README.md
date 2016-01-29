# Angular Drag and Drop
Customizable drag and drop behaviour for Angular.

### [Demo](http://lane.github.io/angular-drag-and-drop/)

## Getting Started

  1. Add `angular-drag-and-drop.js`
  2. Add `angular-drag-and-drop.css`
  3. Add required markup

    ```html
    <drag-and-drop>

      <drag-item>
          <p>Anything in here</p>
          <p>will be draggable</p>
      </drag-item>

      <drop-spot>
        <p>Drop Here</p>
      </drop-spot>

    </drag-and-drop>
    ```

## Customizing

### Options

#### `drag-and-drop`
The following callback functions can be added to the `drag-and-drop` directive.

  - `on-drag-start`: fired when an item starts being dragged
  - `on-drag-end`: fired when an item is released
  - `on-drag-enter`: fired when an item is dragged over a drop spot
  - `on-drag-leave`: fired when an item is dragged outside of a drop spot
  - `on-item-placed`: fired when an item is dropped inside of a drop spot
  - `on-item-removed`: fired when and item is removed from its drop spot
  - `enable-swap`: when set to true, an item will be swapped out when dropping a drag item on to a drop spot that has reached its maximum number of items
  - `fixed-positions`: when set to true, items remain in their start positions when not placed inside of a drop spot

#### `drag-item`
  - `drag-id`: an identifier that is used for this drag item.  When set, the `drag-item` element will have a class that matches the `drag-id`.
  - `drag-data`: use to associate any additional data you may want for the draggable item.
  - `drop-to`: used to position the element within the drop spot.
  - `x`: the x offset of the drag item
  - `y`: the y offset of the drag item
  - `clone` : a clone item is dragged instead of the original item
  - `lock-vertical`: locks the item so it may only be moved left and right

#### `drop-spot`
  - `drop-id`: an identifier that is used for this drop item.  When set, the `drop-spot` element will have a class that matches the `drag-id`.
  - `max-items`: Used to specify the maximum number of items allowed in this drop spot

### Classes
  The following classes are added to elements to allow styling based on the current state of the drag and drop.

  - `dragging`: Added to the `drag-and-drop` wrapper when an item is being dragged.
  - `drop-hovering`: Added to an `drop-spot` element when an item has been dragged over top of the drop spot.
  - `drop-full`: Added to an `drop-spot` when it has reached its maximum number of items (assigned through `max-items`)
  - `drag-active`: added to a `drag-item` element when it is being dragged
  - `{{DRAG_ID}}`: added to an `drag-item` element if the `drag-id` attribute is set
  - `{{DROP_ID}}`: added to an `drop-spot` element if the `drop-id` attribute is set. An `drag-item` element will be given the class `in-{{DROP_ID}}` when it is placed within that drop spot.

## Todo

  - proper z-indexing when lifting and placing drag items
