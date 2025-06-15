import type { RootState, AppDispatch } from "../store";

declare global {
  export type RootState = RootState;
  export type AppDispatch = AppDispatch;
}
