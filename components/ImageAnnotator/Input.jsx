import React, { useState } from "react";

const Input = React.forwardRef(({ top, left, labels, onSubmit }, forwardedRef) => {
  const [value, setValue] = useState("");

  const changeHandler = (e) => {
    // Set value on change
    setValue(e.target.value);

    // If we select an item, submit
    onSubmit(e.target.value);
  };

  return (
    <div
      style={{
        left: `${left}px`,
        top: `${top}px`,
        position: "absolute",
      }}
    >
        <select
          name="label"
          ref={forwardedRef}
          onChange={changeHandler}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option>Choose an item</option>
          {labels.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
    </div>
  );
});

export default Input;
