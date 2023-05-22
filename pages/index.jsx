import React, { useState } from "react";

import ImageAnnotator from "../components/ImageAnnotator";

const Home = () => {
  const [entries, setEntries] = useState([]);
  const onChange = (entries) => {
    setEntries(entries);
  }
  return (
    <>
      <div style={{ width: "60%" }}>
        <ImageAnnotator url="/cows.png" labels={["test", "test2"]} onChange={onChange} />
      </div>
      {JSON.stringify(entries)}
    </>
  );
};

export default Home;
