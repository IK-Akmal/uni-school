import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { studentApi } from "@/shared/api/studentApi";
import { groupApi } from "@/shared/api/groupApi";
import { paymentApi } from "@/shared/api/paymentApi";

export const store = configureStore({
  reducer: {
    [studentApi.reducerPath]: studentApi.reducer,
    [groupApi.reducerPath]: groupApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(studentApi.middleware)
      .concat(groupApi.middleware)
      .concat(paymentApi.middleware),
});

// Настройка листенеров для рефетча данных при фокусе окна и т.д.
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
