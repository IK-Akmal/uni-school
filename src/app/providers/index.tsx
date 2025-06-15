import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";

import { DBProvider } from "@/shared/providers/db";

import { store } from "../store";
import router from "../routers";

const Providers = () => {
  return (
    <Provider store={store}>
      <ConfigProvider>
        <DBProvider dbName="db.sqlite">
          <RouterProvider router={router} />
        </DBProvider>
      </ConfigProvider>
    </Provider>
  );
};

export default Providers;
