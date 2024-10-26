import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
} from "react-router-dom";
import App from "./App";

class Main extends React.Component {
  state = {
    data: null,
  };

  setFileData = (data) => {
    this.setState({ data });
  };

  render() {
    {
      /* 
              <Route path="dashboard" element={<Dashboard />} /> */
    }
    return (
      <Routes>
        <Route
          index
          path="*"
          element={
            <App data={this.state.data} setFileData={this.setFileData} />
          }
        >
          <Route
            path="field/:fieldId"
            element={
              <FieldDetails
                data={this.props.data}
                subpage={this.state.subpage}
                selectedField={this.state.selectedField}
                goToSubpage={this.goToSubpage}
              />
            }
          />
        </Route>
      </Routes>
    );
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
]);

const domNode = document.getElementById("app");
const root = createRoot(domNode);
root.render(<RouterProvider router={router} />);
