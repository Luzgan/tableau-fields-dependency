import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
} from "react-router-dom";
import App from "./App";
import FieldDetails from "./FieldDetails";
import NoFieldSelected from "./NoFieldSelected";
import ReferencesList from "./ReferencesList";
import Graph from "./Graph";

function Main() {
  const [data, setData] = useState(null);

  return (
    <Routes>
      <Route path="/" element={<App data={data} setFileData={setData} />}>
        <Route path="/" element={<NoFieldSelected />} />
        <Route path="field/:fieldId" element={<FieldDetails data={data} />} />
        <Route path="field/:fieldId/graph" element={<Graph data={data} />} />
        <Route
          path="field/:fieldId/indirect"
          element={<ReferencesList indirect data={data} />}
        />
        <Route
          path="field/:fieldId/direct"
          element={<ReferencesList data={data} />}
        />
        <Route path="*" element={<div />} />
      </Route>
    </Routes>
  );
}

const router = createBrowserRouter([
  {
    path: "*",
    element: <Main />,
  },
]);

const domNode = document.getElementById("app");
const root = createRoot(domNode);
root.render(<RouterProvider router={router} />);
