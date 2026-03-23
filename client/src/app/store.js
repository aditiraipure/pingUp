import {configureStore} from "@reduxjs/toolkit";
import userReducer from "../features/userSlice.js";
import messagesReducer from "../features/messages/messagesSlice.js";
import connectionsReducer from "../features/connections/connectionSlice.js";

export const store = configureStore({
  reducer: {
    user:userReducer,
    messages:messagesReducer,
    connections:connectionsReducer,
  },
});