import React from "react";

import styles from "../../styles/Annotator.module.css";

const Bbox = ({
  key,
  type,
  box,
  borderWidth = 2,
  onMouseOver,
  onMouseLeave,
  onCloseBox,
}) => {
  let style = {
    left: `${box.left - borderWidth}px`,
    top: `${box.top - borderWidth}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderWidth: `${borderWidth}px`,
    position: "absolute",
    fontFamily: "monospace",
    fontSize: "small",
  };

  // Modify border and color depending on box state
  if (type === "temp") {
    style.border = `${borderWidth}px dotted rgb(127,255,127)`;
  } else {
    style.border = `${borderWidth}px solid rgb(255,0,0)`;
    style.color = "rgb(255,0,0)";
  }

  return (
    <div
      key={key}
      style={style}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {/* Show close button if bbox hovered */}
      {box.showCloseButton ? (
        <div
          className={styles["close-circle"]}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={onCloseBox}
        >
          <div className={styles.close}>&#215;</div>
        </div>
      ) : null}
      {/* Show label if it exists on bbox */}
      <div style={{ overflow: "hidden" }}>{box.label}</div>
    </div>
  );
};

export default Bbox;
