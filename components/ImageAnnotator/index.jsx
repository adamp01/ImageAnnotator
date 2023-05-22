import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import { v4 as uuid } from "uuid";
import BBox from "./BBox";
import Input from "./Input";

import styles from "../../styles/Annotator.module.css";

const ImageAnnotator = React.forwardRef(
  ({ url, borderWidth = 2, labels, onChange }, ref) => {
    const [pointer, setPointer] = useState(null);
    const [offset, setOffset] = useState(null);
    const [boxes, setBoxes] = useState([]);
    const [multiplier, setMultiplier] = useState(1);
    const [status, setStatus] = useState("free");
    const [imageAnnotatorStyle, setImageAnnotatorStyle] = useState({});
    const [imageFrameStyle, setImageFrameStyle] = useState({});
    const [clickedArea, setClickedArea] = useState({ box: -1, pos: "o" });

    const imageAnnotatorRef = useRef(null);
    const labelInputRef = useRef(null);

    // Set up image canvas on mount
    useEffect(() => {
      const canvas = imageAnnotatorRef.current;

      // Scale down image so that it fits in view nicely
      const maxWidth = canvas?.offsetWidth || 1;

      const imageElement = new Image();
      imageElement.src = url;

      imageElement.onload = function () {
        configureImage(imageElement, maxWidth);
      };
      imageElement.onerror = function () {
        throw "Invalid image URL: " + url;
      };
    }, []);

    const configureImage = (imageElement, maxWidth) => {
      // Define multiplier and image size based on size
      // of canvas
      const width = imageElement.width;
      const height = imageElement.height;
      // setMultiplier is async, so use a local var so
      // we don't have to re-paint
      const multiplierLocal = width / maxWidth;
      setMultiplier(multiplierLocal);
      setImageAnnotatorStyle({
        width: width / multiplierLocal,
        height: height / multiplierLocal,
      });
      setImageFrameStyle({
        backgroundImage: `url(${imageElement.src})`,
        width: width / multiplierLocal,
        height: height / multiplierLocal,
      });
    };

    // When boxes or multiplier change, bubble up to
    // parent onchange
    useEffect(() => {
      onChange(
        boxes.map((box) => ({
          width: Math.round(box.width * multiplier),
          height: Math.round(box.height * multiplier),
          top: Math.round(box.top * multiplier),
          left: Math.round(box.left * multiplier),
          label: box.label,
        }))
      );
    }, [boxes, multiplier]);

    // Pass reset to ref so parent can reset boxes
    useImperativeHandle(ref, () => ({
      reset() {
        setBoxes([]);
      },
    }));

    // Add a new box and reset pointers
    const addBox = (label) => {
      setBoxes([
        ...boxes,
        { ...rect, label, id: uuid(), showCloseButton: false },
      ]);
      setStatus("free");
      setPointer(null);
      setOffset(null);
    };

    // Mouse event handlers
    const handleMouseMove = (e) => {
      switch (status) {
        case "drag":
          updateRectangle(e.pageX, e.pageY);
          break;
        case "modify":
          modifyBbox(e);
          break;
      }
    };

    const handleMouseUp = (e) => {
      switch (status) {
        case "drag":
          updateRectangle(e.pageX, e.pageY);
          setStatus("input");
          labelInputRef.current?.focus();
          break;
        case "modify":
          updateRectangle(e.pageX, e.pageY);
          setStatus("free");
          break;
      }
    };

    const handleMouseDown = (e) => {
      // Need to find current area
      const pos = crop(e.pageX, e.pageY);
      const area = findCurrentArea(pos.x, pos.y);
      setClickedArea(area);

      // If we have clicked on an existing box
      // allow modification
      if (area.box !== -1) {
        // Update offset and pointer for start pos
        setOffset(crop(e.pageX, e.pageY));
        setPointer(crop(e.pageX, e.pageY));
        setStatus("modify");
        return;
      }

      // Otherwise, set drag state
      switch (status) {
        case "free":
        case "input":
          if (e.button !== 2) {
            setOffset(crop(e.pageX, e.pageY));
            setPointer(crop(e.pageX, e.pageY));
            setStatus("drag");
          }
      }
    };

    // Box modification helpers
    const crop = (pageX, pageY) => {
      return {
        x:
          imageAnnotatorRef.current && imageFrameStyle.width
            ? Math.min(
              Math.max(
                Math.round(pageX - imageAnnotatorRef.current.offsetLeft),
                0
              ),
              Math.round(imageFrameStyle.width - 1)
            )
            : 0,
        y:
          imageAnnotatorRef.current && imageFrameStyle.height
            ? Math.min(
              Math.max(
                Math.round(pageY - imageAnnotatorRef.current.offsetTop),
                0
              ),
              Math.round(imageFrameStyle.height - 1)
            )
            : 0,
      };
    };

    function findCurrentArea(x, y) {
      // Find if we are in a modification position of an existing
      // box, within a defined boundary.
      const lineOffset = 20;

      for (let [i, box] of boxes.entries()) {
        const xCenter = box.left + box.width / 2;
        const yCenter = box.top + box.height / 2;

        // Check left side
        if (box.left - lineOffset < x && x < box.left + lineOffset) {
          if (box.top - lineOffset < y && y < box.top + lineOffset) {
            return { box: i, pos: "tl" };
          } else if (
            box.top + box.height - lineOffset < y &&
            y < box.top + box.height + lineOffset
          ) {
            return { box: i, pos: "bl" };
          } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
            return { box: i, pos: "l" };
          }
        } else if (
          // Check right side
          box.left + box.width - lineOffset < x &&
          x < box.left + box.width + lineOffset
        ) {
          if (box.top - lineOffset < y && y < box.top + lineOffset) {
            return { box: i, pos: "tr" };
          } else if (
            box.top + box.height - lineOffset < y &&
            y < box.top + box.height + lineOffset
          ) {
            return { box: i, pos: "br" };
          } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
            return { box: i, pos: "r" };
          }
        } else if (xCenter - lineOffset < x && x < xCenter + lineOffset) {
          // Check top or bottom
          if (box.top - lineOffset < y && y < box.top + lineOffset) {
            return { box: i, pos: "t" };
          } else if (
            box.top + box.height - lineOffset < y &&
            y < box.top + box.height + lineOffset
          ) {
            return { box: i, pos: "b" };
          } else if (
            box.top - lineOffset < y &&
            y < box.top + box.height + lineOffset
          ) {
            return { box: i, pos: "i" };
          }
        } else if (
          box.left - lineOffset < x &&
          x < box.left + box.width + lineOffset
        ) {
          // Check inside
          if (
            box.top - lineOffset < y &&
            y < box.top + box.height + lineOffset
          ) {
            return { box: i, pos: "i" };
          }
        }
      }
      return { box: -1, pos: "o" };
    }

    const modifyBbox = (e) => {
      // Get offset from current pointer
      const { x, y } = offset;
      const c = crop(e.pageX, e.pageY);
      const x2 = c.x;
      const y2 = c.y;
      const xOffset = x2 - x;
      const yOffset = y2 - y;

      // Update offset
      setOffset({ x: x2, y: y2 });

      // Adjust left and width for left and inner
      if (["tl", "l", "bl", "i"].includes(clickedArea.pos)) {
        setBoxes(
          boxes.map((box, index) => {
            if (index === clickedArea.box) {
              box.left = box.left + xOffset;
              if (clickedArea.pos != "i") {
                box.width -= xOffset;
              }
            }
            return box;
          })
        );
      }

      // Adjust top and height for top and inner
      if (["tl", "t", "tr", "i"].includes(clickedArea.pos)) {
        setBoxes(
          boxes.map((box, index) => {
            if (index === clickedArea.box) {
              box.top = box.top + yOffset;
              if (clickedArea.pos != "i") {
                box.height -= yOffset;
              }
            }
            return box;
          })
        );
      }

      // Adjust width for right
      if (["tr", "r", "br"].includes(clickedArea.pos)) {
        setBoxes(
          boxes.map((box, index) => {
            if (index === clickedArea.box) {
              box.width += xOffset;
            }
            return box;
          })
        );
      }

      // Adjust height for bottom
      if (["bl", "b", "br"].includes(clickedArea.pos)) {
        setBoxes(
          boxes.map((box, index) => {
            if (index === clickedArea.box) {
              box.height += yOffset;
            }
            return box;
          })
        );
      }
    };

    // Box creation helpers
    const updateRectangle = (pageX, pageY) => {
      setPointer(crop(pageX, pageY));
    };

    const rectangle = () => {
      const x1 = offset && pointer ? Math.min(offset.x, pointer.x) : 0;
      const x2 = offset && pointer ? Math.max(offset.x, pointer.x) : 0;
      const y1 = offset && pointer ? Math.min(offset.y, pointer.y) : 0;
      const y2 = offset && pointer ? Math.max(offset.y, pointer.y) : 0;
      return {
        left: x1,
        top: y1,
        width: x2 - x1 + 1,
        height: y2 - y1 + 1,
      };
    };

    const rect = rectangle();

    return (
      // Canvas
      <div
        className={styles.imageAnnotator}
        style={imageAnnotatorStyle}
        ref={imageAnnotatorRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className={styles.imageFrame} style={imageFrameStyle}>
          {/* Display temporary bounding box on drag/input */}
          {status === "drag" || status === "input" ? (
            <BBox type="temp" box={rect} />
          ) : null}

          {/* Display input box if temporary box drawn */}
          {status === "input" ? (
            <Input
              top={rect.top + rect.height + borderWidth}
              left={rect.left - borderWidth}
              labels={labels}
              onSubmit={addBox}
              ref={labelInputRef}
            />
          ) : null}

          {/* Display all existing bounding boxes */}
          {boxes.map((box, i) => (
            <BBox
              key={i}
              boxKey={i}
              type="done"
              box={box}
              onMouseMove={(e) => {
                const cropped = crop(e.pageX, e.pageY);
                const { pos } = findCurrentArea(cropped.x, cropped.y);

                switch (pos) {
                  case "i":
                    e.target.className = styles.move;
                    break;
                  case "tl":
                  case "br":
                    e.target.className = styles.nwse;
                    break;
                  case "tr":
                  case "bl":
                    e.target.className = styles.nesw;
                    break;
                  case "l":
                  case "r":
                    e.target.className = styles.ew;
                    break;
                  case "t":
                  case "b":
                    e.target.className = styles.ns;
                    break;
                }
              }}
              onMouseOver={(e) =>
                setBoxes((prevBoxes) =>
                  prevBoxes.map((e) =>
                    e.id === box.id ? { ...e, showCloseButton: true } : e
                  )
                )
              }
              onMouseLeave={() =>
                setBoxes((prevBoxes) =>
                  prevBoxes.map((e) =>
                    e.id === box.id ? { ...e, showCloseButton: false } : e
                  )
                )
              }
              onCloseBox={() => {
                setBoxes(boxes.filter((e) => e.id !== box.id));
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

export default ImageAnnotator;
