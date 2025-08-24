import { createBrowserRouter } from "react-router";

import { Layout } from "@/widgets/layout";
import Home from "@/pages/home";
import Students from "@/pages/students";
import Groups from "@/pages/groups";
import Payments from "@/pages/payments";
import Debtors from "@/pages/debtors";
import About from "@/pages/about";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },

      {
        path: "students",
        Component: Students,
      },
      {
        path: "groups",
        Component: Groups,
      },
      {
        path: "payments",
        Component: Payments,
      },
      {
        path: "debtors",
        Component: Debtors,
      },
      {
        path: "about",
        Component: About,
      },
    ],
  },
]);

export default router;
