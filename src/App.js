import React, { useCallback, useState } from "react";
import "./styles.css";
import GridLayout, { utils } from "react-grid-layout";
import { Wrapper, Placeholder as PlaceholderRoot } from "./Wrapper";
import { calcGridItemPosition } from "./calculateUtils";
import { withSize } from "react-sizeme";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { v4 as uuid } from "uuid";

const GL = GridLayout;
const itemsMargin = [10, 10];
const containerPadding = [10, 10];
const COL_COUNT = 4;

const FIELD_TYPES = ["HEADER", "TEXT_FIELD", "CHECKLIST"];

const initialItems = [
  { id: uuid(), type: FIELD_TYPES[0] },
  { id: uuid(), type: FIELD_TYPES[1] },
  { id: uuid(), type: FIELD_TYPES[2] },
  { id: uuid(), type: FIELD_TYPES[1] }
];

const initialLayout = [
  { i: initialItems[0].id, x: 0, y: 0, w: 1, h: 1 },
  { i: initialItems[1].id, x: 1, y: 0, w: 3, h: 1 },
  { i: initialItems[2].id, x: 3, y: 1, w: 1, h: 1 },
  { i: initialItems[3].id, x: 0, y: 1, w: 1, h: 1 }
];

const ITEM_HEIGHT = 60;

function Placeholder({
  placeholderPosition,
  onClose,
  anchorEl,
  onClick,
  width,
  onAddItem
}) {
  const pos = calcGridItemPosition(
    {
      margin: itemsMargin,
      containerPadding: containerPadding,
      containerWidth: width,
      cols: COL_COUNT,
      rowHeight: ITEM_HEIGHT
    },
    placeholderPosition.x,
    placeholderPosition.y,
    placeholderPosition.w,
    placeholderPosition.h
  );
  const handleOptionClick = type => {
    onAddItem(type, placeholderPosition);
    onClose();
  };
  return (
    <>
      <PlaceholderRoot onClick={onClick} style={utils.setTransform(pos)}>
        Add New Field
      </PlaceholderRoot>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={onClose}
        variant="selectedMenu"
      >
        {FIELD_TYPES.map(i => (
          <MenuItem key={i} onClick={() => handleOptionClick(i)}>
            {i}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const Grid = withSize({ monitorHeight: true })(function({ size }) {
  const [layout, setLayout] = useState(initialLayout);
  const [placeholderPosition, setPlaceholderPosition] = useState();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [items, setItems] = React.useState(initialItems);

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handlePlaceholderClick = event => {
    console.log("click");
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMouseMove = useCallback(
    e => {
      if (!!menuAnchorEl) return;
      const columnWidth =
        (size.width -
          (COL_COUNT - 1) * itemsMargin[0] -
          2 * containerPadding[0]) /
        4;
      const columnWidthWithMargin = columnWidth + itemsMargin[0];
      const itemHeightWithMargin = ITEM_HEIGHT + itemsMargin[1];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cropsndingX = Math.floor(
        (x - containerPadding[0]) / columnWidthWithMargin
      );
      const cropsndingY = Math.floor(
        (y - containerPadding[1]) / itemHeightWithMargin
      );
      const maxHeight = layout.reduce((acc, i) => {
        if (i.y + i.h > acc) return i.y + i.h;
        return acc;
      }, 0);
      if (cropsndingY > -1 && cropsndingX < COL_COUNT && cropsndingX > -1) {
        const position = { x: cropsndingX, y: cropsndingY, w: 1, h: 1 };
        if (
          placeholderPosition &&
          position.x === placeholderPosition.x &&
          position.y === placeholderPosition.y
        )
          return;
        if (layout.find(i => utils.collides(position, i))) {
          setPlaceholderPosition(undefined);
          return;
        }
        if (position.y + position.h > maxHeight) {
          setPlaceholderPosition(undefined);
          return;
        }
        console.log(position);
        setPlaceholderPosition(position);
      }
    },
    [placeholderPosition, size, layout, menuAnchorEl]
  );
  const shouldRenderPlaceholder =
    !isDragging && !isResizing && placeholderPosition;
  const handleAddItem = (type, position) => {
    const newId = uuid();
    setLayout([...layout, { ...position, i: newId }]);
    setItems([...items, { id: newId, type }]);
    setPlaceholderPosition(undefined);
  };
  return (
    <Wrapper onMouseMove={handleMouseMove}>
      {shouldRenderPlaceholder ? (
        <Placeholder
          onAddItem={handleAddItem}
          onClose={handleMenuClose}
          anchorEl={menuAnchorEl}
          onClick={handlePlaceholderClick}
          placeholderPosition={placeholderPosition}
          width={size.width}
        />
      ) : null}
      <GL
        className="layout"
        layout={layout}
        cols={COL_COUNT}
        rowHeight={ITEM_HEIGHT}
        measureBeforeMount
        isResizable
        compactType={null}
        margin={itemsMargin}
        containerPadding={containerPadding}
        onDrag={(...args) => {
          // console.log(args);
        }}
        onLayoutChange={layout => {
          // console.log(layout);
          setLayout(layout);
        }}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDragStop={() => {
          setIsDragging(false);
        }}
        onResizeStart={() => {
          setIsResizing(true);
        }}
        onResizeStop={() => {
          setIsResizing(false);
        }}
        width={size.width}
      >
        {items.map(i => (
          <div key={i.id}>{i.type}</div>
        ))}
      </GL>
    </Wrapper>
  );
});

export default function App() {
  return (
    <div className="App">
      <Grid />
    </div>
  );
}
