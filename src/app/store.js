import { configureStore } from "@reduxjs/toolkit";
import { clientApi } from "../services/clientApi";

export const store = configureStore({
  reducer: {
    [clientApi.reducerPath]: clientApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clientApi.middleware),
});
