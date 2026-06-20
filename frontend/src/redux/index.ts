import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import stJudeReducer from "./feature/stJude";
import usersReducer from "./feature/users"; 
import rolesReducer from "./feature/roles";
import modalReducer from "./feature/modalSlice";
import { ThunkAction, Action } from "@reduxjs/toolkit";

// Configuration pour persister plusieurs slices
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["stJude", "modal"],
};

// Combine all reducers normally
const rootReducer = combineReducers({
  stJude: stJudeReducer,
  users: usersReducer,
  roles: rolesReducer,
  modal: modalReducer,
});

// Envelopper avec persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);


// Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);


export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

