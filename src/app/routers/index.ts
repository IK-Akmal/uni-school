import { createBrowserRouter, redirect } from "react-router";

import { Layout } from "@/widgets/layout";
import Students from "@/pages/students";
import Groups from "@/pages/groups";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        loader: () => {
          return redirect("/students");
        },
      },

      {
        path: "students",
        Component: Students,
      },
      {
        path: "groups",
        Component: Groups,
      },
    ],
  },
]);

export default router;
