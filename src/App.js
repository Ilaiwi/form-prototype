import React, { useCallback, useState } from "react";
import "./styles.css";
import {
  utils,
  Responsive as GridLayout,
  WidthProvider,
} from "react-grid-layout";
import { Wrapper, Placeholder as PlaceholderRoot } from "./Wrapper";
import { calcGridItemPosition } from "./calculateUtils";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { v4 as uuid } from "uuid";
import produce from "immer";

const GL = GridLayout;
const itemsMargin = [10, 10];
const CONTAINER_PADDING = [10, 10];

const FIELD_TYPES = ["HEADER", "TEXT_FIELD", "CHECKLIST", "SECTION"];

const initialItems = [
  { id: uuid(), type: FIELD_TYPES[0] },
  { id: uuid(), type: FIELD_TYPES[1] },
  { id: uuid(), type: FIELD_TYPES[2] },
  { id: uuid(), type: FIELD_TYPES[3], items: [], layout: [] },
];

const initialLayout = [
  { i: initialItems[0].id, x: 0, y: 0, w: 1, h: 1 },
  { i: initialItems[1].id, x: 1, y: 0, w: 3, h: 1 },
  { i: initialItems[2].id, x: 3, y: 1, w: 1, h: 1 },
  { i: initialItems[3].id, x: 0, y: 1, w: 2, h: 2 },
];

const ITEM_HEIGHT = 60;

function Placeholder({
  placeholderPosition,
  onClose,
  anchorEl,
  onClick,
  width,
  onAddItem,
  cols,
  containerPadding,
  rowHeight,
}) {
  const pos = calcGridItemPosition(
    {
      margin: itemsMargin,
      containerPadding: containerPadding,
      containerWidth: width,
      cols: cols,
      rowHeight: rowHeight,
    },
    placeholderPosition.x,
    placeholderPosition.y,
    placeholderPosition.w,
    placeholderPosition.h
  );
  const handleOptionClick = (type) => {
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
        {FIELD_TYPES.map((i) => (
          <MenuItem key={i} onClick={() => handleOptionClick(i)}>
            {i}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const GridBase = function ({
  width,
  layout: layoutResponsive,
  onLayoutChange,
  children,
  onAddItem,
  cols: responsiveCols,
  isChild,
  containerPadding,
  rowHeight,
  ...props
}) {
  const cols = GridLayout.utils.getColsFromBreakpoint(
    GridLayout.utils.getBreakpointFromWidth(responsiveCols, width),
    responsiveCols
  );
  const layout = GridLayout.utils.findOrGenerateResponsiveLayout(
    layoutResponsive,
    responsiveCols,
    GridLayout.utils.getBreakpointFromWidth(responsiveCols, width),
    GridLayout.utils.getBreakpointFromWidth(responsiveCols, width),
    cols,
    null
  );
  console.log(layout)
  const [placeholderPosition, setPlaceholderPosition] = useState();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handlePlaceholderClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMouseMove = useCallback(
    (e) => {
      if (!!menuAnchorEl) return;
      const columnWidth =
        (width - (cols - 1) * itemsMargin[0] - 2 * containerPadding[0]) / cols;
      const columnWidthWithMargin = columnWidth + itemsMargin[0];
      const itemHeightWithMargin = rowHeight + itemsMargin[1];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cropsndingX = Math.floor(
        (x - containerPadding[0]) / columnWidthWithMargin
      );
      const cropsndingY = Math.floor(
        (y - containerPadding[1]) / itemHeightWithMargin
      );
      // const maxHeight = layout.reduce((acc, i) => {
      //   if (i.y + i.h > acc) return i.y + i.h;
      //   return acc;
      // }, 0);
      if (cropsndingY > -1 && cropsndingX < cols && cropsndingX > -1) {
        const position = { x: cropsndingX, y: cropsndingY, w: 1, h: 1 };
        if (
          placeholderPosition &&
          position.x === placeholderPosition.x &&
          position.y === placeholderPosition.y
        )
          return;
        if (layout.find((i) => utils.collides(position, i))) {
          setPlaceholderPosition(undefined);
          return;
        }
        // if (position.y + position.h > maxHeight) {
        //   setPlaceholderPosition(undefined);
        //   return;
        // }
        // console.log(position);
        setPlaceholderPosition(position);
      }
    },
    [placeholderPosition, width, layout, menuAnchorEl, cols]
  );
  const shouldRenderPlaceholder =
    !isDragging && !isResizing && placeholderPosition;
  const handleAddItem = (type, position) => {
    onAddItem(type, position);
    setPlaceholderPosition(undefined);
  };
  return (
    <Wrapper
      onMouseLeave={() => {
        setPlaceholderPosition(undefined);
      }}
      onMouseMove={handleMouseMove}
      isChild={isChild}
    >
      {shouldRenderPlaceholder ? (
        <Placeholder
          onAddItem={handleAddItem}
          onClose={handleMenuClose}
          anchorEl={menuAnchorEl}
          onClick={handlePlaceholderClick}
          placeholderPosition={placeholderPosition}
          width={width}
          cols={cols}
          containerPadding={containerPadding}
          rowHeight={rowHeight}
        />
      ) : null}
      <GL
        {...props}
        className="layout"
        layout={layoutResponsive}
        cols={responsiveCols}
        rowHeight={rowHeight}
        measureBeforeMount
        isResizable
        margin={itemsMargin}
        containerPadding={containerPadding}
        onDrag={(...args) => {
          // console.log(args);
        }}
        onLayoutChange={(l) => {
          onLayoutChange(initialLayout);
          // console.log("onLayoutChange", l);
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
        width={width}
      >
        {children}
      </GL>
    </Wrapper>
  );
};

const GridWithSize = WidthProvider(GridBase);

function Grid() {
  const [items, setItems] = useState(initialItems);
  const [layout, setLayout] = useState(initialLayout);
  const handleAddItem = (type, position) => {
    const newId = uuid();
    setLayout([...layout, { ...position, i: newId }]);
    setItems([
      ...items,
      {
        id: newId,
        type,
        items: type === "SECTION" ? [] : undefined,
        layout: type === "SECTION" ? [] : undefined,
      },
    ]);
  };
  const handleChildLayout = (childLayout, parentItemId) => {
    const newItems = produce(items, (draftItems) => {
      const itemToChange = draftItems.find((i) => i.id === parentItemId);
      itemToChange.layout = childLayout;
    });
    setItems(newItems);
  };
  const handleAddChildItem = (type, position, parentItemId) => {
    const newId = uuid();
    const newItems = produce(items, (draftItems) => {
      const itemToChange = draftItems.find((i) => i.id === parentItemId);
      itemToChange.items.push({ id: newId, type });
      itemToChange.layout.push({ ...position, i: newId });
    });
    setItems(newItems);
  };
  return (
    <>
      <button
        onClick={() => {
          setLayout(initialLayout);
        }}
      >
        reset
      </button>
      <GridWithSize
        onLayoutChange={setLayout}
        onAddItem={handleAddItem}
        style={{ minHeight: CONTAINER_PADDING[0] * 2 + ITEM_HEIGHT }}
        draggableCancel=".no-drag"
        compactType={null}
        containerPadding={CONTAINER_PADDING}
        rowHeight={ITEM_HEIGHT}
        layout={{ l: layout, s: layout }}
        breakpoints={{ l: 700, s: 0 }}
        cols={{ l: 4, s: 2 }}
        measureBeforeMount={true}
      >
        {items.map((i) => {
          // if (i.type === "SECTION") {
          //   const layoutItem = layout.find((x) => x.i === i.id);
          //   return (
          //     <div style={{ width: "100%", height: "100%" }} key={i.id}>
          //       <GridWithSize
          //         containerPadding={[10, 0]}
          //         isChild
          //         breakpoints={{ l: 1200, s: 0 }}
          //         cols={{l: layoutItem.w, s: 2}}
          //         style={{ minHeight: layoutItem.h * ITEM_HEIGHT - 10 }}
          //         rowHeight={ITEM_HEIGHT - 10}
          //         onLayoutChange={(childLayout) => {
          //           handleChildLayout(childLayout, i.id);
          //         }}
          //         onAddItem={(type, pos) => handleAddChildItem(type, pos, i.id)}
          //         layout={i.layout}
          //         compactType="vertical"
          //       >
          //         {i.items.map((y) => (
          //           <div className={"no-drag"} key={y.id}>
          //             {y.type}
          //           </div>
          //         ))}
          //       </GridWithSize>
          //     </div>
          //   );
          // }
          return <div key={i.id}>{i.type}</div>;
        })}
      </GridWithSize>
    </>
  );
}

export default function App() {
  return (
    <div className="App">
      <Grid />
    </div>
  );
}
