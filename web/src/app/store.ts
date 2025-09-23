// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
// import { all } from "redux-saga/effects";
import userReducer from "../features/user/userSlice";
// import userSaga from "../features/user/userSaga";

const sagaMiddleware = createSagaMiddleware();

function* rootSaga() {
  // yield all([userSaga()]);
}

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
